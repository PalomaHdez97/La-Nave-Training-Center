const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// secret should be defined in env (JWT_SECRET)
const SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Middleware que verifica el token JWT y comprueba si no está revocado.
 * Asume cabecera Authorization: Bearer <token>
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Falta cabecera Authorization' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    // verificar firma
    const payload = jwt.verify(token, SECRET);
    // guardar token y payload en req para uso posterior
    req.token = token;
    req.user = payload;

    // revisar tabla revoked_tokens y estado activo
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT token FROM revoked_tokens WHERE token = ?',
        [token]
      );
      if (rows.length > 0) {
        return res.status(401).json({ error: 'Token revocado' });
      }

      // 1. Verificar si el usuario sigue activo en la BD
      const [userRows] = await connection.query(
        'SELECT activo FROM usuario WHERE idusuario = ?',
        [payload.id || payload.idusuario]
      );

      if (userRows.length === 0 || userRows[0].activo === 0) {
        return res.status(401).json({ error: 'Usuario inactivo. Contacta con el administrador.' });
      }

    } finally {
      connection.release();
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware que verifica si el usuario autenticado tiene rol de administrador.
 * Debe ir SIEMPRE después de verifyToken.
 */
function isAdmin(req, res, next) {
  // Verificamos que el req.user exista (lo pone verifyToken)
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  // Comparamos si is_admin es 1 (o true)
  if (req.user.is_admin !== 1 && req.user.is_admin !== true) {
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
  }

  next();
}

module.exports = { verifyToken, isAdmin };