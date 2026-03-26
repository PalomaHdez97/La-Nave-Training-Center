const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// rutas de gestión de usuarios
// endpoint para obtener todos los usuarios (solo administrador)
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getAll);

// endpoint para obtener un usuario por id (protegido)
router.get('/:id', authMiddleware.verifyToken, userController.getById);

// endpoint para crear un usuario (solo administradores)
router.post('/crearusuario', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.createUser);

// endpoint para desactivar un usuario (solo administradores)
router.put('/:id/desactivar', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.deactivateUser);

// endpoint para activar un usuario (solo administradores)
router.put('/:id/activar', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.activateUser);

// endpoint de actualización administrativa (solo administradores)
router.put('/admin/update/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.adminUpdate);

// endpoint para actualizar el propio perfil (cualquier usuario autenticado)
router.put('/perfil/actualizar', authMiddleware.verifyToken, userController.updateProfile);

module.exports = router;
