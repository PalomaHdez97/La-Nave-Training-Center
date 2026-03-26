const pool = require('../config/db');

module.exports = {
    // Obtener usuario por ID de la base de datos
    async getUserById(id) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT u.idusuario, u.email, u.nombre, u.is_admin, u.activo, u.foto, 
                        p.nombre as plan_nombre, p.precio as plan_precio, p.limite_semanal
                 FROM usuario u
                 LEFT JOIN plan p ON u.id_plan = p.idPlan
                 WHERE u.idusuario = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    },

    // Crear un nuevo usuario insertándolo en la base de datos (con bcrypt para la contraseña)
    async createUser(userData) {
        const bcrypt = require('bcrypt');
        const connection = await pool.getConnection();
        try {
            // Verificar si el correo ya existe
            const [existing] = await connection.query('SELECT idusuario FROM usuario WHERE email = ?', [userData.email]);
            if (existing.length > 0) {
                throw new Error('El email ya está registrado');
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const planId = userData.planId || 1; // Asignamos plan 1 por defecto
            const isAdmin = userData.is_admin ? 1 : 0; // Por defecto 0 (false)
            const isActive = userData.activo !== undefined ? (userData.activo ? 1 : 0) : 1; // Por defecto 1 (true)

            const [result] = await connection.query(
                'INSERT INTO usuario (email, nombre, contraseña, id_plan, is_admin, activo) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.email, userData.username, hashedPassword, planId, isAdmin, isActive]
            );

            return {
                idusuario: result.insertId,
                email: userData.email,
                username: userData.username,
                is_admin: isAdmin,
                activo: isActive,
                foto: null
            };
        } finally {
            connection.release();
        }
    },

    // Desactivar un usuario por su ID ("Borrado lógico")
    async deactivateUser(userId) {
        if (!userId) {
            return { ok: false, error: 'ID de usuario es requerido para desactivar' };
        }

        const connection = await pool.getConnection();
        try {
            // Eliminamos sus reservas primero
            await connection.query('DELETE FROM reservas WHERE idusuario = ?', [userId]);

            // Hacemos un borrado lógico marcando activo = 0
            const [result] = await connection.query('UPDATE usuario SET activo = 0 WHERE idusuario = ?', [userId]);

            if (result.affectedRows === 0) {
                return { ok: false, error: 'Usuario no encontrado o ya estaba desactivado' };
            }

            return { ok: true, message: 'Usuario desactivado correctamente' };
        } catch (err) {
            return { ok: false, error: err.message };
        } finally {
            connection.release();
        }
    },

    // Activar un usuario por su ID
    async activateUser(userId) {
        if (!userId) {
            return { ok: false, error: 'ID de usuario es requerido para activar' };
        }

        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query('UPDATE usuario SET activo = 1 WHERE idusuario = ?', [userId]);

            if (result.affectedRows === 0) {
                return { ok: false, error: 'Usuario no encontrado o ya estaba activado' };
            }

            return { ok: true, message: 'Usuario activado correctamente' };
        } catch (err) {
            return { ok: false, error: err.message };
        } finally {
            connection.release();
        }
    },

    // Actualizar perfil de usuario
    async updateUserProfile(userId, userData) {
        const connection = await pool.getConnection();
        try {
            const updates = [];
            const values = [];

            if (userData.nombre !== undefined) {
                updates.push('nombre = ?');
                values.push(userData.nombre);
            }
            if (userData.email !== undefined) {
                updates.push('email = ?');
                values.push(userData.email);
            }
            if (userData.foto !== undefined) {
                updates.push('foto = ?');
                values.push(userData.foto);
            }
            if (userData.password) {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                updates.push('contraseña = ?');
                values.push(hashedPassword);
            }

            if (updates.length === 0) return { ok: true, message: 'Nada que actualizar' };

            values.push(userId);
            const [result] = await connection.query(
                `UPDATE usuario SET ${updates.join(', ')} WHERE idusuario = ?`,
                values
            );

            if (result.affectedRows === 0) {
                throw new Error('Usuario no encontrado');
            }

            return { ok: true, message: 'Perfil actualizado correctamente' };
        } finally {
            connection.release();
        }
    },

    // Obtener todos los usuarios (para admin)
    async getAllUsers() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
                SELECT u.idusuario, u.email, u.nombre, u.is_admin, u.activo, u.foto, 
                       p.nombre as plan_nombre, p.precio as plan_precio, u.id_plan
                FROM usuario u
                LEFT JOIN plan p ON u.id_plan = p.idPlan
                ORDER BY u.nombre ASC
            `);
            return rows;
        } finally {
            connection.release();
        }
    },

    // Actualización administrativa (para administrador)
    async updateUserAdmin(userId, updateData) {
        const connection = await pool.getConnection();
        try {
            const updates = [];
            const values = [];

            if (updateData.nombre !== undefined) {
                updates.push('nombre = ?');
                values.push(updateData.nombre);
            }
            if (updateData.email !== undefined) {
                updates.push('email = ?');
                values.push(updateData.email);
            }
            if (updateData.id_plan !== undefined) {
                updates.push('id_plan = ?');
                values.push(updateData.id_plan);
            }
            if (updateData.is_admin !== undefined) {
                updates.push('is_admin = ?');
                values.push(updateData.is_admin);
            }

            // --- RESTORE MANUAL PASSWORD UPDATE --- Broadway
            if (updateData.password !== undefined && updateData.password.trim() !== '') {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(updateData.password, 10);
                updates.push('contraseña = ?');
                values.push(hashedPassword);
            }

            if (updates.length === 0) return { ok: true, message: 'Nada que actualizar' };

            values.push(userId);
            const [result] = await connection.query(
                `UPDATE usuario SET ${updates.join(', ')} WHERE idusuario = ?`,
                values
            );

            // Si se ha desactivado al usuario, eliminamos sus reservas Broadway
            if (updateData.activo === false || updateData.activo === 0) {
                await connection.query('DELETE FROM reservas WHERE idusuario = ?', [userId]);
            }

            return { ok: true, affectedRows: result.affectedRows };
        } finally {
            connection.release();
        }
    }
};
