const express = require('express');
const router = express.Router();



// rutas independientes
const authRoutes = require('./auth');
const userRoutes = require('./user');
const reservationRoutes = require('./reservation');

// punto de comprobación básica
router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});


// montar rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reservations', reservationRoutes);


module.exports = router;
