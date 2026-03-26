document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
        window.location.href = '../login/index.html';
        return;
    }

    const user = JSON.parse(storedUser);
    if (!user.is_admin) {
        window.location.href = '../welcome/index.html';
        return;
    }

    // UI Elements
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const userPillTrigger = document.getElementById('user-pill-trigger');
    const userDropdown = document.getElementById('user-dropdown-menu');
    const userPillName = document.getElementById('user-pill-name');
    const avatarBadge = document.getElementById('user-avatar-badge');
    const ajustesDropdownBtn = document.getElementById('ajustes-dropdown-btn');
    const ajustesContainer = document.getElementById('ajustes-container');

    function updateUI() {
        if (userPillName) userPillName.textContent = user.nombre || user.email || 'Admin';
        const savedPhoto = user.foto;
        if (avatarBadge) {
            avatarBadge.style.background = ''; // Limpiar fondo previo
            if (savedPhoto) {
                if (savedPhoto.startsWith('data:image')) {
                    avatarBadge.innerHTML = `<img src="${savedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                } else {
                    avatarBadge.textContent = savedPhoto;
                    avatarBadge.innerHTML = savedPhoto;
                    avatarBadge.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)';
                }
            } else {
                avatarBadge.textContent = (user.nombre || user.email || 'A').charAt(0).toUpperCase();
                avatarBadge.innerHTML = (user.nombre || user.email || 'A').charAt(0).toUpperCase();
            }
        }
        renderProfileAvatar(savedPhoto, user.nombre || user.email);
    }

    updateUI();

    // User Dropdown Toggle
    if (userPillTrigger && userDropdown) {
        userPillTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('visible');
        });
    }

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !userPillTrigger.contains(e.target)) {
            userDropdown.classList.remove('visible');
        }
    });

    // Sidebar Logic
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        setTimeout(() => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('visible');
        }, 10);
    }

    if (menuToggle) menuToggle.onclick = toggleSidebar;
    if (sidebarOverlay) sidebarOverlay.onclick = toggleSidebar;

    const homeBtn = document.getElementById('home-btn');
    const usersBtn = document.getElementById('users-btn');
    const reservasBtn = document.getElementById('reservas-btn');
    const homePanel = document.getElementById('home-panel');
    const usersPanel = document.getElementById('users-panel');
    const reservasPanel = document.getElementById('reservas-panel');
    const allPanels = [homePanel, usersPanel, reservasPanel, ajustesContainer];

    function showPanel(panel) {
        allPanels.forEach(p => { if (p) p.classList.add('hidden'); });
        if (panel) panel.classList.remove('hidden');

        if (homeBtn) homeBtn.classList.remove('active');
        if (usersBtn) usersBtn.classList.remove('active');
        if (reservasBtn) reservasBtn.classList.remove('active');

        if (panel === homePanel && homeBtn) homeBtn.classList.add('active');
        if (panel === usersPanel && usersBtn) {
            usersBtn.classList.add('active');
            loadUsers();
        }
        if (panel === reservasPanel && reservasBtn) {
            reservasBtn.classList.add('active');
            loadReservations();
        }

        if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
    }

    if (homeBtn) homeBtn.onclick = (e) => { e.preventDefault(); showPanel(homePanel); };
    if (usersBtn) usersBtn.onclick = (e) => { e.preventDefault(); showPanel(usersPanel); };
    if (reservasBtn) reservasBtn.onclick = (e) => {
        e.preventDefault();
        showPanel(reservasPanel);
    };

    if (ajustesDropdownBtn) {
        ajustesDropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (userDropdown) userDropdown.classList.remove('visible');
            showPanel(ajustesContainer);
            initProfilePanel();
        });
    }

    // Logout
    logoutBtn.onclick = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Animación de salida (opcional, para igualar welcome)
        const activePanel = [homePanel, usersPanel].find(p => !p.classList.contains('hidden'));
        if (activePanel) {
            activePanel.style.opacity = '0';
            activePanel.style.transform = 'translateY(20px)';
        }

        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 500);
    };

    // Load Data
    async function loadUsers() {
        const tbody = document.getElementById('users-list-body');
        if (!tbody.innerText.trim()) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando atletas...</td></tr>';
        }

        try {
            const res = await fetch('http://localhost:3000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();

            document.getElementById('stat-total-users').textContent = users.length;

            const planes = [
                { id: 1, nombre: 'Junior' },
                { id: 2, nombre: 'Bronce' },
                { id: 3, nombre: 'Plata' },
                { id: 4, nombre: 'Oro' }
            ];

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.nombre || 'Atleta'}</td>
                    <td>${u.email}</td>
                    <td>
                        ${u.is_admin ? '<span style="color:var(--text-muted); opacity:0.5;">—</span>' : `
                            <select class="admin-select" onchange="window.changeUserPlan(${u.idusuario}, this.value)">
                                ${planes.map(p => `
                                    <option value="${p.id}" ${u.id_plan === p.id ? 'selected' : ''}>${p.nombre}</option>
                                `).join('')}
                            </select>
                        `}
                    </td>
                    <td>
                        <select class="admin-select" onchange="window.changeUserRole(${u.idusuario}, this.value)">
                            <option value="0" ${u.is_admin ? '' : 'selected'}>Atleta</option>
                            <option value="1" ${u.is_admin ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        <span class="status-pill ${u.activo ? 'status-active' : 'status-inactive'}">
                            ${u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <button style="background:none; border:none; cursor:pointer; margin-right:8px;" title="Restablecer Contraseña"
                                onclick="window.resetUserPassword(${u.idusuario}, '${u.nombre || u.email}')">
                            🔑
                        </button>
                        <button style="background:none; border:none; cursor:pointer;" title="${u.activo ? 'Desactivar' : 'Ativar'}" 
                                onclick="window.toggleUserStatus(${u.idusuario}, ${u.activo})">
                            ${u.activo ? '🛑' : '✅'}
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar datos.</td></tr>';
        }
    }

    window.changeUserPlan = async (userId, planId) => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/admin/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id_plan: planId })
            });

            if (res.ok) {
                // Opcional: mostrar un toast o aviso pequeño
                console.log('Plan actualizado');
            } else {
                alert('Error al actualizar el plan');
                loadUsers(); // Recargar para volver al estado anterior
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        }
    };

    window.changeUserRole = async (userId, isAdmin) => {
        // Regla: no permitir que el admin actual se quite su propio rol de admin accidentalmente
        if (parseInt(userId) === user.idusuario && parseInt(isAdmin) === 0) {
            alert('No puedes quitarte el rol de administrador a ti mismo.');
            loadUsers();
            return;
        }

        const roleName = parseInt(isAdmin) === 1 ? 'Administrador' : 'Atleta';
        if (!confirm(`¿Estás seguro de que quieres cambiar el rol de este usuario a ${roleName}?`)) {
            loadUsers();
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/users/admin/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_admin: parseInt(isAdmin) })
            });

            if (res.ok) {
                console.log('Rol actualizado');
                // Si cambiamos un rol ajeno, refrescamos. 
                // Si el usuario cambia el suyo propio (aunque lo bloqueamos arriba), 
                // se podría forzar logout pero lo ideal es no dejar que lo haga.
                loadUsers();
            } else {
                alert('Error al actualizar el rol');
                loadUsers();
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        }
    };

    window.resetUserPassword = async (userId, userName) => {
        const newPassword = prompt(`Introduce la nueva contraseña para ${userName}:`);
        
        if (newPassword === null) return; // Cancelado
        if (newPassword.trim() === '') {
            alert('La contraseña no puede estar vacía. Broadway');
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres cambiar la contraseña de ${userName}? Broadway`)) return;

        try {
            const res = await fetch(`http://localhost:3000/api/users/admin/update/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                alert(`✓ Contraseña de ${userName} restablecida correctamente. Broadway`);
            } else {
                const data = await res.json();
                alert(data.error || 'Error al restablecer contraseña Broadway');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión Broadway');
        }
    };

    window.toggleUserStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'desactivar' : 'activar';
        const confirmMsg = currentStatus
            ? '¿Estás seguro de que quieres desactivar a este atleta? No podrá reservar clases hasta que lo reactives.'
            : '¿Quieres volver a activar a este atleta?';

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}/${action}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                loadUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al cambiar estado');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // --- Lógica Perfil ---
    function renderProfileAvatar(photoUrl, name) {
        const profileAvatarEl = document.getElementById('profile-avatar');
        if (!profileAvatarEl) return;
        profileAvatarEl.style.background = ''; // Limpiar fondo previo
        if (photoUrl) {
            if (photoUrl.startsWith('data:image')) {
                profileAvatarEl.innerHTML = `<img src="${photoUrl}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                profileAvatarEl.textContent = photoUrl;
                profileAvatarEl.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)';
            }
        } else {
            profileAvatarEl.textContent = (name || 'Admin').substring(0, 2).toUpperCase();
        }
    }

    function initProfilePanel() {
        const nombreInput = document.getElementById('profile-nombre');
        const emailInput = document.getElementById('profile-email');
        if (nombreInput) nombreInput.value = user.nombre || '';
        if (emailInput) emailInput.value = user.email || '';
        renderProfileAvatar(user.foto, user.nombre || user.email);
    }

    // Avatar Menu Logic
    const avatarOptionsMenu = document.getElementById('profile-avatar-options-menu');
    const avatarTrigger = document.getElementById('profile-avatar-menu-trigger');
    if (avatarTrigger && avatarOptionsMenu) {
        avatarTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarOptionsMenu.classList.toggle('visible');
        });

        avatarOptionsMenu.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                user.foto = emoji;
                localStorage.setItem('user', JSON.stringify(user));
                updateUI();
                avatarOptionsMenu.classList.remove('visible');
            });
        });

        const uploadBtn = document.getElementById('profile-upload-photo-btn');
        const fileInput = document.getElementById('profile-avatar-upload');
        if (uploadBtn && fileInput) {
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    user.foto = ev.target.result;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateUI();
                    avatarOptionsMenu.classList.remove('visible');
                };
                reader.readAsDataURL(file);
            };
        }
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertEl = document.getElementById('profile-alert');
            const successEl = document.getElementById('profile-success');
            const saveBtn = document.getElementById('profile-save-btn');
            const nombre = document.getElementById('profile-nombre').value.trim();
            const email = document.getElementById('profile-email').value.trim();

            alertEl.style.display = 'none';
            successEl.style.display = 'none';
            saveBtn.classList.add('btn-loading');
            saveBtn.disabled = true;

            const photo = user.foto;

            try {
                const res = await fetch('http://localhost:3000/api/users/perfil/actualizar', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ nombre, email, foto: photo })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error al guardar');

                // Actualizar datos locales
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Refrescar variable local 'user'
                Object.assign(user, updatedUser);

                updateUI();
                successEl.style.display = 'block';
                setTimeout(() => { successEl.style.display = 'none'; }, 3000);
            } catch (err) {
                alertEl.textContent = err.message;
                alertEl.style.display = 'block';
            } finally {
                saveBtn.classList.remove('btn-loading');
                saveBtn.disabled = false;
            }
        });
    }

    // Cerrar menús al hacer clic fuera (agregando el de avatar)
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !userPillTrigger.contains(e.target)) {
            userDropdown.classList.remove('visible');
        }
        if (avatarOptionsMenu && !avatarOptionsMenu.contains(e.target) && avatarTrigger && !avatarTrigger.contains(e.target)) {
            avatarOptionsMenu.classList.remove('visible');
        }
    });

    // Initial stats
    async function updateStats() {
        try {
            const res = await fetch('http://localhost:3000/api/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classes = await res.json();

            const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const map = { 'lunes': 'Lunes', 'martes': 'Martes', 'miércoles': 'Miércoles', 'jueves': 'Jueves', 'viernes': 'Viernes', 'sábado': 'Sábado' };
            const today = map[days[new Date().getDay()]];
            let total = 0;
            classes.forEach(c => { if (c.diaSemana === today) total += c.users.length; });

            if (document.getElementById('stat-today-res')) {
                document.getElementById('stat-today-res').textContent = total;
            }
        } catch (err) {
            console.error('Error updating stats:', err);
        }
    }

    // Monitor de Reservas (Admin Calendar)
    let selectedDay = 'Lunes';

    async function loadReservations() {
        const daysList = document.getElementById('admin-days-list');
        const container = document.getElementById('admin-sessions-container');
        if (!daysList || !container) return;

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        daysList.innerHTML = dias.map(d => `
            <div class="day-item ${d === selectedDay ? 'active' : ''}" onclick="window.adminSelectDay('${d}')">
                <span>${d.charAt(0)}</span>
                <strong>${d.slice(0, 3)}</strong>
            </div>
        `).join('');

        if (!container.innerText.trim()) {
            container.innerHTML = '<p style="text-align:center;">Cargando sesiones...</p>';
        }

        try {
            const res = await fetch('http://localhost:3000/api/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classes = await res.json();

            // Filtrar por día seleccionado
            const filtered = classes.filter(c => c.diaSemana === selectedDay);

            container.innerHTML = filtered.map(c => `
                <div class="session-details-card">
                    <div class="session-card-header">
                        <h3 class="session-time">${c.hora.slice(0, 5)} - Funcional</h3>
                        <span class="session-counter">${c.users.length} / ${c.cap_maxima} plazas</span>
                    </div>
                    <div class="user-avatars-list">
                        ${c.users.length > 0 ? c.users.map(u => `
                            <div class="user-avatar-slot" title="${u.nombre}">
                                ${u.foto && u.foto.startsWith('data:image')
                    ? `<img src="${u.foto}" alt="${u.nombre}">`
                    : `<span>${u.foto || (u.nombre || 'U').charAt(0).toUpperCase()}</span>`}
                            </div>
                        `).join('') : '<p class="empty-msg">Sin reservas todavía</p>'}
                    </div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = '<p>Error al cargar el monitor.</p>';
        }
    }

    window.adminSelectDay = (day) => {
        selectedDay = day;
        loadReservations();
    };

    loadUsers();
    updateStats();
    loadReservations();

    // Auto-actualizar cada 30 segundos
    setInterval(updateStats, 30000);
    setInterval(loadReservations, 30000);
});
