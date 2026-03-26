const userService = require('../services/userService');

module.exports = {
    // Obtener un usuario por su ID
    async getById(req, res) {
        const { id } = req.params;
        try {
            const user = await userService.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Obtener todos los usuarios (solo admin)
    async getAll(req, res) {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Crear un usuario nuevo
    async createUser(req, res) {
        const userData = req.body;
        try {
            if (!userData.email || !userData.username || !userData.password) {
                return res.status(400).json({ error: 'Email, username y password son obligatorios' });
            }
            const newUser = await userService.createUser(userData);
            res.status(201).json({ user: newUser, message: 'Usuario creado exitosamente' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    // Desactivar a un usuario por ID (desde panel de administrador)
    async deactivateUser(req, res) {
        const { id } = req.params;             // El ID del usuario que se quiere desactivar
        const adminId = req.user.id;           // El ID del administrador que hace la petición

        try {
            // Regla: un administrador no puede desactivarse a sí mismo
            if (parseInt(id) === adminId) {
                return res.status(403).json({ error: 'Operación denegada: Un administrador no puede desactivarse a sí mismo.' });
            }

            // Regla: no se puede desactivar a otro administrador
            const targetUser = await userService.getUserById(id);
            if (!targetUser) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            if (targetUser.is_admin) {
                return res.status(403).json({ error: 'Operación denegada: No se puede desactivar a un administrador.' });
            }

            // Usamos el servicio de usuarios para la desactivación
            const result = await userService.deactivateUser(id);

            if (result && result.ok) {
                return res.json(result);
            }
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al desactivar el usuario' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    // Activar a un usuario por ID (desde panel de administrador)
    async activateUser(req, res) {
        const { id } = req.params;             // El ID del usuario que se quiere activar

        try {
            // Usamos el servicio de usuarios para la activación
            const result = await userService.activateUser(id);

            if (result && result.ok) {
                return res.json(result);
            }
            return res.status(500).json({ error: result && result.error ? result.error : 'Error al activar el usuario' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    // Actualizar el perfil del propio usuario
    async updateProfile(req, res) {
        const userId = req.user.id;
        const userData = req.body;

        try {
            const result = await userService.updateUserProfile(userId, userData);
            if (result.ok) {
                // Obtener datos actualizados para devolver al frontend
                const updatedUser = await userService.getUserById(userId);
                return res.json({ ok: true, user: updatedUser, message: 'Perfil actualizado' });
            }
            res.status(400).json({ error: result.error || 'Error al actualizar el perfil' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Actualización administrativa (solo administradores)
    async adminUpdate(req, res) {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const result = await userService.updateUserAdmin(id, updateData);
            if (result.ok) {
                return res.json({ ok: true, message: 'Usuario actualizado por el administrador' });
            }
            res.status(400).json({ error: 'Error al actualizar el usuario' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

