const pool = require('../config/db');
const bcrypt = require('bcrypt');

module.exports = {
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }

    const connection = await pool.getConnection();
    try {
      // 1. Buscamos al usuario por su email y traemos también datos del plan mediante JOIN
      // ¡Importante!: pedimos la columna 'contraseña' para poder compararla
      const [rows] = await connection.query(
        `SELECT u.idusuario,
              u.email,
              u.nombre,
              u.id_plan,
              u.is_admin,
              u.activo,
              u.contraseña,
              u.foto,
              p.nombre AS plan_nombre,
              p.precio AS plan_precio
           FROM usuario u
           LEFT JOIN plan p ON u.id_plan = p.idPlan
           WHERE u.email = ?`,
        [username]
      );

      if (rows.length === 0) {
        // no existe un usuario con ese email
        throw new Error('Usuario no encontrado');
      }

      const user = rows[0];

      // 2. Usamos bcrypt para comparar la contraseña del formulario con el hash de la BD
      let esCorrecta = await bcrypt.compare(password, user.contraseña);

      // si no coincide con el hash, comprobamos si la contraseña en la base
      // todavía está en texto plano (caso de migración). En ese caso la
      // consideramos válida y además re‑hasheamos el valor para actualizarla.
      if (!esCorrecta && password === user.contraseña) {
        esCorrecta = true;
        const nuevoHash = await bcrypt.hash(password, 10);
        // actualización silenciosa
        await connection.query(
          'UPDATE usuario SET contraseña = ? WHERE idusuario = ?',
          [nuevoHash, user.idusuario]
        );
        user.contraseña = nuevoHash;
      }

      if (!esCorrecta) {
        // contraseña no coincide
        throw new Error('Contraseña incorrecta');
      }

      // 3. Verificar si el usuario está activo
      if (user.activo === 0 || user.activo === false) {
        throw new Error('Tu cuenta está desactivada. Contacta con el administrador.');
      }

      // 4. Eliminamos la contraseña del objeto antes de devolverlo por seguridad
      delete user.contraseña;
      // renombramos campos de plan si queremos una estructura más clara
      if (user.plan_nombre) {
        user.plan = {
          nombre: user.plan_nombre,
          precio: user.plan_precio
        };
        delete user.plan_nombre;
        delete user.plan_precio;
      }
      return user;

    } finally {
      connection.release();
    }
  },



  // planId opcional, por defecto 1 (asegúrate de que exista en la tabla `plan`)
  async register(email, nombre, password, planId = 1) {
    if (!email || !nombre || !password) {
      throw new Error('Email, nombre y contraseña son requeridos');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const connection = await pool.getConnection();
    try {
      // Verificar si el usuario ya existe
      const [existing] = await connection.query(
        'SELECT idusuario FROM usuario WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar nuevo usuario (is_admin falso (0) y activo verdadero (1) por defecto)
      const [result] = await connection.query(
        'INSERT INTO usuario (email, nombre, contraseña, id_plan, is_admin, activo) VALUES (?, ?, ?, ?, ?, ?)',
        [email, nombre, hashedPassword, planId, 0, 1]
      );

      return {
        idusuario: result.insertId,
        email,
        nombre,
        is_admin: 0,
        activo: 1,
        foto: null
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  },

  // Logout: opcionalmente revoca un token (inserta en `revoked_tokens`) o elimina sesiones por userId
  // Uso: await authService.logout({ token: jwtToken })  o await authService.logout({ userId: 123 })
  async logout({ token = null, userId = null } = {}) {
    const connection = await pool.getConnection();
    try {
      if (token) {
        // Creamos una tabla de tokens revocados si no existe y añadimos el token
        await connection.query(
          `CREATE TABLE IF NOT EXISTS revoked_tokens (
             token VARCHAR(512) PRIMARY KEY,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
           )`
        );
        await connection.query('INSERT INTO revoked_tokens (token) VALUES (?)', [token]);
        return { ok: true, message: 'Token revocado' };
      }

      if (userId) {
        // Intentamos eliminar sesiones si existe la tabla `sessions` (silencioso si no existe)
        await connection.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
        return { ok: true, message: 'Sesiones del usuario eliminadas (si existían)' };
      }

      return { ok: true, message: 'No se proporcionó token ni userId; no se realizó ninguna acción' };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      connection.release();
    }
  },

  // Actualizar un usuario autenticado por su ID
  async updateUser(userId, data) {
    if (!userId) {
      return { ok: false, error: 'ID de usuario es requerido para actualizar' };
    }

    const updates = [];
    const values = [];

    // Verificamos qué campos han sido enviados para incluirlos dinámicamente en el UPDATE
    if (data.nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(data.nombre);
    }

    if (data.password !== undefined) {
      if (data.password.length < 6) {
        return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }
      const newHash = await bcrypt.hash(data.password, 10);
      updates.push('contraseña = ?');
      values.push(newHash);
    }

    if (data.planId !== undefined) {
      updates.push('id_plan = ?');
      values.push(data.planId);
    }

    if (data.is_admin !== undefined) {
      updates.push('is_admin = ?');
      values.push(data.is_admin ? 1 : 0);
    }

    if (data.activo !== undefined) {
      updates.push('activo = ?');
      values.push(data.activo ? 1 : 0);
    }

    if (updates.length === 0) {
      return { ok: false, error: 'No hay campos válidos para actualizar' };
    }

    values.push(userId); // para la cláusula WHERE

    const query = `UPDATE usuario SET ${updates.join(', ')} WHERE idusuario = ?`;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(query, values);

      if (result.affectedRows === 0) {
        return { ok: false, error: 'Usuario no encontrado' };
      }

      return { ok: true, message: 'Usuario actualizado correctamente' };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      connection.release();
    }
  }
};

