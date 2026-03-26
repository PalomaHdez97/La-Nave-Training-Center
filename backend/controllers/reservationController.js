const reservationService = require('../services/reservationService');

module.exports = {
    async getAll(req, res) {
        try {
            const data = await reservationService.getClassesWithSchedules();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async getUserReservations(req, res) {
        try {
            const userId = req.user.id;
            const data = await reservationService.getUserReservations(userId);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async book(req, res) {
        try {
            const { idClase } = req.body;
            const userId = req.user.id;
            const result = await reservationService.bookClass(userId, idClase);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    async cancel(req, res) {
        try {
            const { idClase } = req.body;
            const userId = req.user.id;
            const result = await reservationService.cancelReservation(userId, idClase);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};
