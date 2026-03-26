const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// endpoint de login
router.post('/login', authController.login);

// endpoint de registro
router.post('/register', authController.register);

// endpoint de logout
router.post('/logout', authController.logout);

// logout actual usando token en header y middleware para verificar/revocar
router.get('/logout', authMiddleware.verifyToken, authController.logoutCurrent);

// endpoint para eliminar usuario autenticado
router.delete('/delete', authMiddleware.verifyToken, authController.delete);

// endpoint para actualizar usuario autenticado
router.put('/update', authMiddleware.verifyToken, authController.update);

module.exports = router;







/**
 * /api/auth/login GET POST PUT DELETE
 * /api la entrada del backend
 *     /auth rutas de autenticación
 *         /login
 *            -> accion
 *         /register
 *         /logout 
 *         /update 
 *         /delete 
 *     /users rutas de gestión de usuarios
 *         /id
 *         /crearusuario
 *     /planes rutas de gestión de planes
 *     /clases rutas de gestión de clases
 */
