document.addEventListener('DOMContentLoaded', () => {
    const welcomeContainer = document.getElementById('welcome-container');
    const misReservasContainer = document.getElementById('mis-reservas-container');
    const ajustesContainer = document.getElementById('ajustes-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const logoutBtn = document.getElementById('logout-btn');
    const bookBtn = document.getElementById('book-btn');
    const homeBtn = document.getElementById('home-btn');
    const reservasBtn = document.getElementById('reservas-btn');
    const ajustesDropdownBtn = document.getElementById('ajustes-dropdown-btn');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const pillName = document.getElementById('user-pill-name');
    const avatarBadge = document.getElementById('user-avatar-badge');
    const welcomeAvatarEl = document.getElementById('welcome-avatar');
    const profileAvatarEl = document.getElementById('profile-avatar');
    const profileUpload = document.getElementById('profile-avatar-upload');
    const profileFormEl = document.getElementById('profile-form');
    const alertEl = document.getElementById('profile-alert');
    const successEl = document.getElementById('profile-success');
    const saveBtn = document.getElementById('profile-save-btn');

    // Comprobar si hay una sesión guardada
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
        window.location.href = '../login/index.html';
        return;
    }

    let user = JSON.parse(storedUser);

    // --- Cargar datos actualizados del backend ---
    async function refreshUserData() {
        try {
            const currentId = user.idusuario || user.id;
            if (!currentId) return;
            const res = await fetch(`http://localhost:3000/api/users/${currentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const refreshedUser = await res.json();
                user = { ...user, ...refreshedUser };
                localStorage.setItem('user', JSON.stringify(user));
                updateUI();
            }
        } catch (err) {
            console.error('Error refreshing user data:', err);
        }
    }

    function updateUI() {
        userNameDisplay.innerText = user.nombre || user.email;
        const savedPhoto = user.foto;

        if (pillName) pillName.textContent = user.nombre || user.email;
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
                avatarBadge.textContent = (user.nombre || user.email || 'U').charAt(0).toUpperCase();
                avatarBadge.innerHTML = (user.nombre || user.email || 'U').charAt(0).toUpperCase();
            }
        }
        renderWelcomeAvatar();
        renderProfileAvatar(savedPhoto, user.nombre || user.email);
    }

    refreshUserData();

    // --- Avatar de bienvenida (foto de perfil) ---
    function renderWelcomeAvatar() {
        if (!welcomeAvatarEl) return;
        const savedPhoto = user.foto;
        // Reset background style in case it was set by an emoji
        welcomeAvatarEl.style.background = '';
        
        if (savedPhoto) {
            if (savedPhoto.startsWith('data:image')) {
                welcomeAvatarEl.innerHTML = `<img src="${savedPhoto}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                welcomeAvatarEl.textContent = savedPhoto;
                welcomeAvatarEl.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)';
            }
        } else {
            welcomeAvatarEl.textContent = (user.nombre || user.email || 'U').substring(0, 2).toUpperCase();
        }
    }
    renderWelcomeAvatar();

    // --- Lógica del Menú de Avatar ---
    function setupAvatarMenu(triggerId, menuId, uploadBtnId, inputId) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);
        const uploadBtn = document.getElementById(uploadBtnId);
        const fileInput = document.getElementById(inputId);

        if (!trigger || !menu) return;

        // --- Restaurar Trigger del Menú de Avatar ---
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('visible');
        });

        // Manejar selección de emojis
        menu.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                user.foto = emoji;
                localStorage.setItem('user', JSON.stringify(user));
                updateUI();
                menu.classList.remove('visible');
            });
        });

        // Manejar botón de subida
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
                menu.classList.remove('visible');
            });
        }
    }

    setupAvatarMenu('profile-avatar-menu-trigger', 'profile-avatar-options-menu', 'profile-upload-photo-btn', 'profile-avatar-upload');

    // --- Lógica del Menú de Usuario (Top Nav) ---
    const userPillTrigger = document.getElementById('user-pill-trigger');
    const userDropdown = document.getElementById('user-dropdown-menu');
    const avatarOptionsMenu = document.getElementById('profile-avatar-options-menu');
    const avatarTrigger = document.getElementById('profile-avatar-menu-trigger');

    if (userPillTrigger && userDropdown) {
        userPillTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('visible');
        });
    }

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
        // Cerrar dropdown de usuario
        if (userDropdown && !userDropdown.contains(e.target) && !userPillTrigger.contains(e.target)) {
            userDropdown.classList.remove('visible');
        }
        // Cerrar menú de avatar
        if (avatarOptionsMenu && !avatarOptionsMenu.contains(e.target) && avatarTrigger && !avatarTrigger.contains(e.target)) {
            avatarOptionsMenu.classList.remove('visible');
        }
    });

    // Subida de foto: convierte a base64 y guarda en localStorage
    const savedPhotoForBadge = user.foto;

    const pageTitle = document.getElementById('page-title');
    function setPageTitle(title) {
        if (pageTitle) pageTitle.textContent = title;
    }

    // --- Hamburguesa: abrir/cerrar sidebar ---
    function openSidebar() {
        sidebar.classList.remove('hidden');
        // Pequeño delay para permitir que el navegador registre que ya no es 'display: none' antes de animar
        setTimeout(() => {
            sidebar.classList.add('open');
            menuToggle.classList.add('is-open');
            sidebarOverlay.classList.add('visible');
        }, 10);
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        menuToggle.classList.remove('is-open');
        sidebarOverlay.classList.remove('visible');

        // Esperar a que la transición CSS termine antes de poner display: none
        setTimeout(() => {
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('hidden');
            }
        }, 350);
    }
    if (menuToggle) menuToggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // --- Helpers de navegación de paneles ---
    const homePanel = document.getElementById('home-panel');
    const allPanels = [welcomeContainer, misReservasContainer, ajustesContainer, homePanel];
    const allLinks = document.querySelectorAll('.sidebar-link');

    function showPanel(panelToShow, activeLink) {
        allPanels.forEach(p => {
            if (p) {
                p.classList.add('hidden');
                p.style.opacity = '0';
                p.style.transform = (p.id === 'home-panel') ? 'scale(0.95)' : 'translateY(20px)';
            }
        });
        allLinks.forEach(l => l.classList.remove('active'));

        if (panelToShow) {
            panelToShow.classList.remove('hidden');
            // Timeout para asegurar que el navegador procese el remove de 'hidden' antes de la opacidad
            setTimeout(() => {
                panelToShow.style.opacity = '1';
                panelToShow.style.transform = (panelToShow.id === 'home-panel') ? 'scale(1)' : 'translateY(0)';
            }, 50);
        }
        if (activeLink) activeLink.classList.add('active');
        closeSidebar();
    }

    // --- Transición Inicial: Bienvenida -> Home (Logo) ---
    function initWelcomeTransition() {
        const isFirstLogin = sessionStorage.getItem('firstLoginAfterLanding');

        if (isFirstLogin) {
            // Mostrar bienvenida inicialmente
            welcomeContainer.classList.remove('hidden');
            welcomeContainer.style.opacity = '1';

            // Consumir el flag para que no se repita en F5
            sessionStorage.removeItem('firstLoginAfterLanding');

            // Tras 2 segundos, cambiar al panel del logo
            setTimeout(() => {
                welcomeContainer.style.opacity = '0';
                welcomeContainer.style.transform = 'translateY(-20px)';

                setTimeout(() => {
                    welcomeContainer.classList.add('hidden');
                    showPanel(homePanel, homeBtn);
                }, 600);
            }, 2000);
        } else {
            // Ignorar bienvenida y mostrar Home directamente
            showPanel(homePanel, homeBtn);
        }
    }

    initWelcomeTransition();

    // --- Botón Inicio ---
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPanel(homePanel, homeBtn);
        });
    }

    // --- Botón Reservar Clases ---
    if (bookBtn) {
        bookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const activePanel = allPanels.find(p => p && !p.classList.contains('hidden'));
            if (activePanel) {
                activePanel.style.opacity = '0';
                activePanel.style.transform = 'translateY(-20px)';
            }
            setTimeout(() => {
                window.location.href = '../reservas/index.html';
            }, 400);
        });
    }

    // --- Botón Mis Reservas ---
    if (reservasBtn) {
        reservasBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPanel(misReservasContainer, reservasBtn);
            renderMisReservas();
        });
    }

    // --- Botón Ajustes (en dropdown) ---
    if (ajustesDropdownBtn) {
        ajustesDropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (userDropdown) userDropdown.classList.remove('visible');
            showPanel(ajustesContainer); // No pasamos activeLink porque ya no está en el sidebar
            initProfilePanel();
        });
    }

    // --- Lógica del Panel de Edición de Perfil ---
    function renderProfileAvatar(photoUrl, name) {
        if (!profileAvatarEl) return;
        // Reset background
        profileAvatarEl.style.background = '';
        
        if (photoUrl) {
            if (photoUrl.startsWith('data:image')) {
                profileAvatarEl.innerHTML = `<img src="${photoUrl}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                profileAvatarEl.textContent = photoUrl;
                profileAvatarEl.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)';
            }
        } else {
            profileAvatarEl.textContent = (name || 'U').substring(0, 2).toUpperCase();
        }
    }

    function initProfilePanel() {
        const savedPhoto = user.foto;

        // Rellenar campos
        const nombreInput = document.getElementById('profile-nombre');
        const emailInput = document.getElementById('profile-email');
        const planInput = document.getElementById('profile-plan');
        if (nombreInput) nombreInput.value = user.nombre || '';
        if (emailInput) emailInput.value = user.email || '';
        if (planInput) planInput.value = user.plan_nombre || 'Sin plan asignado';

        // Mostrar avatar actual
        renderProfileAvatar(savedPhoto, user.nombre || user.email);

        // Subida de foto desde el panel de perfil
        const profileUpload = document.getElementById('profile-avatar-upload');
        if (profileUpload) {
            profileUpload.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    user.foto = ev.target.result;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateUI();
                };
                reader.readAsDataURL(file);
            };
        }
    }

    // Guardar cambios del formulario de perfil
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

            if (!nombre || !email) {
                alertEl.textContent = 'El nombre y el email son obligatorios.';
                alertEl.style.display = 'block';
                return;
            }

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
                user = data.user;
                localStorage.setItem('user', JSON.stringify(user));
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

    // --- Lógica Mis Reservas ---
    function getWeekRange() {
        const hoy = new Date();
        const diaSemana = hoy.getDay() || 7; // 1=Lun … 7=Dom
        const monday = new Date(hoy);
        monday.setDate(hoy.getDate() - diaSemana + 1);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { monday, sunday };
    }

    function formatDateLabel(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const diasNombre = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return `${diasNombre[d.getDay()].charAt(0).toUpperCase() + diasNombre[d.getDay()].slice(1)} ${day}/${String(month).padStart(2, '0')}`;
    }

    async function renderMisReservas() {
        const reservasList = document.getElementById('reservas-list');
        const semanaLabel = document.getElementById('reservas-semana-label');
        if (!reservasList) return;

        const { monday, sunday } = getWeekRange();
        const lunesLabel = monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const domingoLabel = sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        semanaLabel.textContent = `Semana del ${lunesLabel} al ${domingoLabel}`;

        try {
            reservasList.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.5;">Cargando tus reservas...</p>';

            // 1. Obtener solo MIS reservas desde el endpoint especializado
            const res = await fetch('http://localhost:3000/api/reservations/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const myReservations = await res.json();

            if (!myReservations || myReservations.length === 0) {
                reservasList.innerHTML = `
                    <div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
                        <div style="font-size: 2.5rem; margin-bottom: 15px;">🗓️</div>
                        <p style="font-size: 0.95rem;">No tienes reservas para esta semana.</p>
                        <a href="../reservas/index.html" style="
                            display: inline-block; margin-top: 20px;
                            background: var(--primary); color: white;
                            padding: 10px 24px; border-radius: 8px;
                            font-size: 0.9rem; font-weight: 600; text-decoration: none;
                        ">Reservar una clase →</a>
                    </div>`;
                return;
            }

            // Mapeo de nombres de días a offset desde el lunes (0)
            const dayToOffset = {
                'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4, 'Sábado': 5
            };

            // 3. Procesar y ordenar reservas
            const processedReservations = myReservations.map(r => {
                const offset = dayToOffset[r.diaSemana] || 0;
                const date = new Date(monday);
                date.setDate(monday.getDate() + offset);
                return { ...r, calculatedDate: date };
            }).sort((a, b) => a.calculatedDate - b.calculatedDate || a.hora.localeCompare(b.hora));

            reservasList.innerHTML = '';

            // Cabecera resumen
            const resumenEl = document.createElement('p');
            resumenEl.style.cssText = 'color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;';
            resumenEl.textContent = `${processedReservations.length} clase${processedReservations.length > 1 ? 's' : ''} reservada${processedReservations.length > 1 ? 's' : ''} esta semana`;
            reservasList.appendChild(resumenEl);

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            processedReservations.forEach(r => {
                const esPasada = r.calculatedDate < hoy;
                const formattedDateStr = `${r.diaSemana} ${r.calculatedDate.getDate()}/${String(r.calculatedDate.getMonth() + 1).padStart(2, '0')}`;

                const card = document.createElement('div');
                card.style.cssText = `
                    display: flex; align-items: center; gap: 16px; padding: 16px; margin-bottom: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid ${esPasada ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.3)'};
                    border-radius: 14px; opacity: ${esPasada ? '0.55' : '1'}; transition: all 0.2s;
                `;

                card.innerHTML = `
                    <div style="
                        width: 48px; height: 48px; border-radius: 12px;
                        background: ${esPasada ? 'rgba(255,255,255,0.07)' : 'var(--primary)'};
                        display: flex; align-items: center; justify-content: center;
                        font-size: 1.3rem; flex-shrink: 0;
                    ">${esPasada ? '✓' : '🏋️'}</div>
                    <div style="flex: 1;">
                        <p style="margin:0; font-weight:600; color: var(--text-main); font-size: 0.95rem;">
                            Entrenamiento Funcional
                        </p>
                        <p style="margin:4px 0 0; color: var(--text-muted); font-size: 0.82rem;">
                            ${formattedDateStr} · ${r.hora.slice(0, 5)}
                        </p>
                    </div>
                    <span style="
                        font-size: 0.75rem; font-weight: 600; padding: 4px 10px;
                        border-radius: 20px;
                        background: ${esPasada ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.2)'};
                        color: ${esPasada ? 'var(--text-muted)' : '#a5b4fc'};
                    ">${esPasada ? 'Asistida' : 'Confirmada'}</span>
                    
                    ${!esPasada ? `
                    <button class="cancel-reserva-btn" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 5px; margin-left: 5px; display: flex; align-items: center; justify-content: center;" title="Quitar reserva">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                    ` : ''}
                `;

                const cancelBtn = card.querySelector('.cancel-reserva-btn');
                if (cancelBtn) {
                    cancelBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await cancelarReserva(r.idClase, formattedDateStr, r.hora.slice(0, 5));
                    };
                }

                reservasList.appendChild(card);
            });
        } catch (err) {
            console.error('Error renderMisReservas:', err);
            reservasList.innerHTML = '<p style="color:#ef4444; text-align:center;">Error al cargar las reservas.</p>';
        }
    }

    // --- Cancelar Reserva ---
    async function cancelarReserva(idClase, dateLabel, timeLabel) {
        if (!confirm(`¿Estás seguro de que deseas quitar tu reserva del ${dateLabel} a las ${timeLabel}?`)) {
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/reservations/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idClase })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cancelar');
            }

            // Refrescar la lista
            await renderMisReservas();
        } catch (error) {
            alert(error.message);
        }
    }

    // --- Cerrar Sesión ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            const activePanel = allPanels.find(p => p && !p.classList.contains('hidden'));
            if (activePanel) {
                activePanel.style.opacity = '0';
                activePanel.style.transform = 'translateY(20px)';
            }

            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 500);
        });
    }
});
