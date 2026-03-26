const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas de reservas requieren autenticación
router.use(authMiddleware.verifyToken);

// Obtener todas las clases con sus reservas (para admin y visualización general)
router.get('/', reservationController.getAll);

// Obtener reservas del usuario actual
router.get('/my', reservationController.getUserReservations);

// Reservar una clase
router.post('/book', reservationController.book);

// Cancelar una reserva
router.post('/cancel', reservationController.cancel);

module.exports = router;
