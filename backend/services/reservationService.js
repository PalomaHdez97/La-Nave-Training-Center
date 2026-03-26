const pool = require('../config/db');

module.exports = {
    // Obtener todas las reservas (para el admin)
    async getAllReservations() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT r.idreserva, r.idusuario, u.nombre as usuario_nombre, u.foto as usuario_foto,
                       c.idClase, c.diaSemana, c.hora
                FROM reservas r
                JOIN usuario u ON r.idusuario = u.idusuario
                JOIN clases c ON r.idClase = c.idClase
                WHERE u.activo = 1
            `);
            return rows;
        } finally {
            connection.release();
        }
    },

    // Obtener reservas de un usuario específico
    async getUserReservations(userId) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT r.idreserva, c.idClase, c.diaSemana, c.hora
                FROM reservas r
                JOIN clases c ON r.idClase = c.idClase
                WHERE r.idusuario = ?
            `, [userId]);
            return rows;
        } finally {
            connection.release();
        }
    },

    // Realizar una reserva
    async bookClass(userId, classId) {
        const connection = await pool.getConnection();
        try {
            // 1. Obtener el día de la semana de la clase que intenta reservar
            const [classData] = await connection.query('SELECT diaSemana FROM clases WHERE idClase = ?', [classId]);
            if (classData.length === 0) throw new Error('Clase no encontrada');
            const targetDay = classData[0].diaSemana;

            // 2. Verificar si ya tiene UNA reserva en ESE MISMO DÍA de la semana
            const [existing] = await connection.query(`
                SELECT r.idreserva 
                FROM reservas r
                JOIN clases c ON r.idClase = c.idClase
                WHERE r.idusuario = ? AND c.diaSemana = ?
            `, [userId, targetDay]);

            if (existing.length > 0) {
                throw new Error(`Ya tienes una reserva para el ${targetDay}. Solo se permite una clase por día.`);
            }

            // 3. Verificar Límite Semanal según el Plan
            const [userPlanData] = await connection.query(`
                SELECT p.limite_semanal, p.nombre as plan_nombre
                FROM usuario u
                JOIN plan p ON u.id_plan = p.idPlan
                WHERE u.idusuario = ?
            `, [userId]);

            if (userPlanData.length > 0) {
                const limit = userPlanData[0].limite_semanal;
                const planName = userPlanData[0].plan_nombre;

                const [currentReservations] = await connection.query(`
                    SELECT COUNT(*) as count 
                    FROM reservas 
                    WHERE idusuario = ?
                `, [userId]);

                if (currentReservations[0].count >= limit) {
                    throw new Error(`Has alcanzado tu límite semanal de ${limit} clases con tu plan ${planName}.`);
                }
            }
            // Verificar capacidad
            const [classInfo] = await connection.query('SELECT cap_maxima FROM clases WHERE idClase = ?', [classId]);
            const [countInfo] = await connection.query('SELECT COUNT(*) as count FROM reservas WHERE idClase = ?', [classId]);

            if (countInfo[0].count >= classInfo[0].cap_maxima) {
                throw new Error('La clase está llena');
            }

            const [result] = await connection.query(
                'INSERT INTO reservas (idusuario, idClase) VALUES (?, ?)',
                [userId, classId]
            );
            return { idreserva: result.insertId, idusuario: userId, idClase: classId };
        } finally {
            connection.release();
        }
    },

    // Cancelar una reserva
    async cancelReservation(userId, classId) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'DELETE FROM reservas WHERE idusuario = ? AND idClase = ?',
                [userId, classId]
            );
            if (result.affectedRows === 0) {
                throw new Error('No se encontró la reserva para cancelar');
            }
            return { ok: true };
        } finally {
            connection.release();
        }
    },

    // Obtener clases y sus ocupaciones actuales
    async getClassesWithSchedules() {
        const connection = await pool.getConnection();
        try {
            const [classes] = await connection.query('SELECT * FROM clases');
            const [reservas] = await connection.query(`
                SELECT r.idClase, u.foto, u.nombre, u.idusuario
                FROM reservas r
                JOIN usuario u ON r.idusuario = u.idusuario
                WHERE u.activo = 1
            `);

            // Agrupar reservas por clase
            const classReservations = {};
            reservas.forEach(res => {
                if (!classReservations[res.idClase]) classReservations[res.idClase] = [];
                classReservations[res.idClase].push({
                    foto: res.foto,
                    nombre: res.nombre,
                    idusuario: res.idusuario
                });
            });

            return classes.map(c => ({
                ...c,
                users: classReservations[c.idClase] || []
            }));
        } finally {
            connection.release();
        }
    }
};
