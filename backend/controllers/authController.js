const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_this_secret';

module.exports = {
    async login(req, res) {
        const { username, password } = req.body;
        try {
            if (username == null) {
                throw new Error("El nombre de usuario es requerido");
            }
            if (password == null) {
                throw new Error("La contraseña es requerida");
            }
            if (typeof username !== "string") {
                throw new Error("El nombre de usuario debe ser una cadena de texto");
            }
            if (typeof password !== "string") {
                throw new Error("La contraseña debe ser una cadena de texto");
            }
            const user = await authService.login(username, password);
            const token = jwt.sign(
                { id: user.idusuario, email: user.email, is_admin: user.is_admin }, // Carga (payload)
                SECRET,                                     // Clave secreta
                { expiresIn: '24h' }                        // Expiración
            );
            res.json({ user, token });


        } catch (err) {
            res.status(401).json({ error: err.message });
        }
    },

    async register(req, res) {
        const { email, username, password, planId } = req.body;
        try {
            if (!email || !username || !password) {
                throw new Error("Email, nombre y contraseña son requeridos");
            }
            if (typeof email !== "string") {
                throw new Error("El email debe ser una cadena de texto");
            }
            if (typeof username !== "string") {
                throw new Error("El nombre debe ser una cadena de texto");
            }
            if (typeof password !== "string") {
                throw new Error("La contraseña debe ser una cadena de texto");
            }
            const user = await authService.register(email, username, password, planId);
            res.status(201).json({ user, message: "Usuario registrado correctamente" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    ,

    async logout(req, res) {
        const { token, userId } = req.body;
        try {
            if (!token && !userId) {
                throw new Error('Se requiere token o userId para el logout');
            }

            const result = await authService.logout({ token, userId });
            if (result && result.ok) {
                return res.json(result);
            }

            // si result.ok es false, devolvemos 500 con el error
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al hacer logout' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    ,

    // logout current session using token passed by middleware (req.token)
    async logoutCurrent(req, res) {
        const token = req.token;
        try {
            if (!token) {
                throw new Error('No hay token en la solicitud');
            }
            const result = await authService.logout({ token });
            if (result && result.ok) {
                return res.json(result);
            }
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al hacer logout' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    // eliminar el usuario autenticado
    async delete(req, res) {
        const userId = req.user.id; // se obtiene desde el verifyToken middleware
        try {
            if (!userId) {
                throw new Error('ID de usuario no disponible');
            }
            const result = await authService.deleteUser(userId);
            if (result && result.ok) {
                return res.json(result);
            }
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al eliminar la cuenta' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    // actualizar el usuario autenticado
    async update(req, res) {
        const userId = req.user.id; // se obtiene desde el verifyToken middleware
        const updateData = req.body;
        try {
            if (!userId) {
                throw new Error('ID de usuario no disponible');
            }
            if (!updateData || Object.keys(updateData).length === 0) {
                throw new Error('No se enviaron datos para actualizar');
            }
            const result = await authService.updateUser(userId, updateData);
            if (result && result.ok) {
                return res.json(result);
            }
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al actualizar la cuenta' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};
