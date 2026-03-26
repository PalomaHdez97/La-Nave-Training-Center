document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');

    // Obtener los contenedores a alternar
    const classMenuContainer = document.getElementById('class-menu-container');
    const reservaContainer = document.getElementById('reserva-container');
    const classNameDisplay = document.getElementById('selected-class-name');

    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
        window.location.href = '../login/index.html';
        return;
    }
    const user = JSON.parse(storedUser);

    const reservaForm = document.getElementById('reserva-form');
    const reservaBtn = document.getElementById('reserva-btn');
    const reservaAlert = document.getElementById('reserva-alert');
    const reservaSuccess = document.getElementById('reserva-success');

    // Botones de navegación
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    let selectedClass = null;
    let selectedClassName = '';

    // Elementos del nuevo UI
    const daysList = document.getElementById('days-list');
    const timesList = document.getElementById('times-list');
    const currentDateDisplay = document.getElementById('current-date-display');
    const selectedTimeDisplay = document.getElementById('selected-time-display');
    const usersGrid = document.getElementById('users-grid');
    const sessionsContainer = document.getElementById('sessions-container'); // Nuevo contenedor
    const summaryList = document.getElementById('summary-list'); // Nuevo contenedor sidebar
    const openReservaFormBtn = document.getElementById('open-reserva-form');
    const homeIconNav = document.getElementById('home-icon-nav');

    if (homeIconNav) {
        homeIconNav.onclick = () => {
            window.location.href = '../welcome/index.html';
        };
    }

    let selectedDateInfo = null;
    let selectedTimeStr = null;
    let currentWeekOffset = 0;
    let countdownInterval = null;

    // Estado para simular datos guardados de capacidad
    const scheduleData = {};
    const avatarGenerators = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=',
        'https://api.dicebear.com/7.x/micah/svg?seed=',
        'https://api.dicebear.com/7.x/adventurer/svg?seed='
    ];

    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay() || 7;
        date.setDate(date.getDate() - day + 1);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function generarDias() {
        if (!daysList) return;
        daysList.innerHTML = '';
        clearInterval(countdownInterval);

        const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const hoy = new Date();
        const mondayThisWeek = getMonday(hoy);

        // Calcular el sabado a las 9:00 de esta semana
        const unlockDate = new Date(mondayThisWeek);
        unlockDate.setDate(mondayThisWeek.getDate() + 5); // 0=Mon, 5=Sat
        unlockDate.setHours(9, 0, 0, 0);

        if (currentWeekOffset === 1 && hoy < unlockDate) {
            // Semana siguiente bloqueada
            daysList.style.display = 'block';
            daysList.innerHTML = `<div class="locked-week-msg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 5px; opacity: 0.5;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <p>Las reservas de la próxima semana abren el sábado a las 09:00</p>
                <strong id="countdown-timer"></strong>
            </div>`;
            timesList.innerHTML = '';
            sessionDetails.style.display = 'none';
            currentDateDisplay.textContent = "Próxima Semana";

            const updateCountdown = () => {
                const now = new Date();
                const diff = unlockDate - now;
                if (diff <= 0) {
                    clearInterval(countdownInterval);
                    generarDias(); // Desbloqueado!
                    return;
                }
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                const timerEl = document.getElementById('countdown-timer');
                if (timerEl) timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
            };
            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);
            return;
        }

        daysList.style.display = 'flex';
        const startOfWeek = new Date(mondayThisWeek);
        startOfWeek.setDate(startOfWeek.getDate() + (currentWeekOffset * 7));

        let currentActiveBtn = null;

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);

            // Saltar domingos (0) ya que no hay clases
            if (d.getDay() === 0) continue;

            const btn = document.createElement('div');
            btn.className = 'day-item';

            const isPast = d.setHours(23, 59, 59, 999) < hoy.getTime();

            const diaLetra = diasSemana[d.getDay()];
            const diaNum = d.getDate();
            const dateStr = d.toISOString().split('T')[0];

            let prefix = '';
            if (currentWeekOffset === 0) {
                if (d.toDateString() === hoy.toDateString()) prefix = 'Hoy, ';
                else if (new Date(hoy.getTime() + 86400000).toDateString() === d.toDateString()) prefix = 'Mañana, ';
            }

            const fullDateText = `${prefix}${nombresDias[d.getDay()]} ${diaNum}/${String(d.getMonth() + 1).padStart(2, '0')}`;

            btn.innerHTML = `<span>${diaLetra}</span><strong>${diaNum}</strong>`;

            btn.onclick = () => {
                document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                selectedDateInfo = { id: dateStr, text: fullDateText };
                currentDateDisplay.textContent = fullDateText;
                generarHoras(d);
            };

            if (d.toDateString() === hoy.toDateString() || (!currentActiveBtn && !isPast)) {
                if (!currentActiveBtn) {
                    currentActiveBtn = btn;
                }
            }
            daysList.appendChild(btn);
        }

        if (currentActiveBtn) {
            currentActiveBtn.click();
        } else {
            timesList.innerHTML = '';
            if (sessionsContainer) sessionsContainer.innerHTML = '';
            currentDateDisplay.textContent = "Semana Finalizada";
        }
    }

    async function generarHoras() {
        if (!timesList || !sessionsContainer) return;

        timesList.innerHTML = '<p style="text-align:center; width:100%; font-size:0.8rem; opacity:0.5;">Cargando sesiones...</p>';
        sessionsContainer.innerHTML = '';

        try {
            // 1. Obtener datos reales del backend
            const res = await fetch('http://localhost:3000/api/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allClasses = await res.json();

            // 2. Determinar el día de la semana seleccionado (ID de la fecha)
            const daysNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const dateObj = new Date(selectedDateInfo.id.replace(/-/g, '/'));
            const diaSemanaNormalizado = daysNames[dateObj.getDay()];

            // Mapeo a los nombres exactos en tu Base de Datos
            const mapBD = {
                'lunes': 'Lunes',
                'martes': 'Martes',
                'miércoles': 'Miércoles',
                'jueves': 'Jueves',
                'viernes': 'Viernes',
                'sábado': 'Sábado'
            };
            const diaBD = mapBD[diaSemanaNormalizado];

            // Filtrar las clases por el día seleccionado
            const filteredClasses = allClasses.filter(c => c.diaSemana === diaBD);

            // Determinar si el usuario ya tiene UNA reserva en este día (en cualquier hora)
            const existsBookingToday = filteredClasses.some(c =>
                (c.users || []).some(u => u.nombre === user.nombre || u.email === user.email)
            );

            timesList.innerHTML = '';

            if (!filteredClasses.length) {
                timesList.innerHTML = `<p style="text-align:center; width:100%; opacity:0.5;">No hay clases programadas para el ${diaBD}.</p>`;
                return;
            }

            filteredClasses.forEach((clase) => {
                const hStr = clase.hora.slice(0, 5);

                // --- Botón superior de hora ---
                const btn = document.createElement('div');
                btn.className = 'time-item';
                btn.textContent = hStr;
                btn.onclick = () => {
                    document.querySelectorAll('.time-item').forEach(el => el.classList.remove('active'));
                    btn.classList.add('active');
                    const card = document.getElementById(`card-${clase.idClase}`);
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };
                timesList.appendChild(btn);

                // --- Tarjeta de sesión ---
                const sessionCard = document.createElement('div');
                sessionCard.className = 'session-details-card';
                sessionCard.id = `card-${clase.idClase}`;

                const usersInClass = clase.users || [];
                const currentUserId = user.idusuario || user.id;
                const isUserBooked = usersInClass.some(u => u.idusuario === currentUserId);
                const isFull = usersInClass.length >= clase.cap_maxima;

                // --- Lógica de tiempo para deshabilitar pasadas ---
                const now = new Date();
                const [h, m] = hStr.split(':').map(Number);
                const sessionDate = new Date(selectedDateInfo.id.replace(/-/g, '/'));
                sessionDate.setHours(h, m, 0, 0);
                const isPast = sessionDate < now;
                // ------------------------------------------------

                sessionCard.innerHTML = `
                    <div class="session-header">
                        <div class="session-title-wrapper">
                            <div class="accent-line"></div>
                            <h2>ENTRENAMIENTO<br>FUNCIONAL*</h2>
                        </div>
                        <h2 class="session-time-display">${hStr}</h2>
                    </div>
                    <div class="users-grid">
                        ${Array.from({ length: clase.cap_maxima }, (_, i) => {
                    if (i < usersInClass.length) {
                        const u = usersInClass[i];
                        return `
                                    <div class="user-avatar-slot" title="${u.nombre}">
                                        ${u.foto && u.foto.startsWith('data:image')
                                ? `<img src="${u.foto}">`
                                : `<span style="font-size:1.1rem;">${u.foto || '👤'}</span>`}
                                    </div>`;
                    }
                    return `<div class="user-avatar-slot empty"></div>`;
                }).join('')}
                    </div>
                    <div style="margin-top:20px;">
                        ${isUserBooked ? `
                            <button class="btn-secondary cancel-btn" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.2);">
                                Cancelar Reserva
                            </button>
                        ` : `
                            <button class="btn-primary booking-btn" ${(isFull || isPast) ? 'disabled style="opacity:0.5"' : ''}>
                                ${isPast ? 'Wod finalizado' : (isFull ? 'Sesión Completa' : 'Reservar Plaza')}
                            </button>
                        `}
                    </div>
                `;

                const bBtn = sessionCard.querySelector('.booking-btn');
                if (bBtn) bBtn.onclick = () => procesarReserva(bBtn, clase.idClase, hStr);

                const cBtn = sessionCard.querySelector('.cancel-btn');
                if (cBtn) cBtn.onclick = () => procesarCancelacion(cBtn, clase.idClase);

                sessionsContainer.appendChild(sessionCard);
            });

            // Activar automáticamente la primera hora disponible
            const firstHour = timesList.querySelector('.time-item');
            if (firstHour) firstHour.classList.add('active');

        } catch (err) {
            console.error('Error al cargar clases:', err);
            timesList.innerHTML = '<p style="color:#ef4444;">Error al conectar con el servidor.</p>';
        }
    }

    async function procesarReserva(btn, classId, time) {
        const date = selectedDateInfo.id;

        btn.classList.add('btn-loading');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Reservando...';

        try {
            const res = await fetch('http://localhost:3000/api/reservations/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idClase: classId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al reservar');

            // Refrescar UI
            await generarHoras();
            await renderSummary();

            // Feedback visual
            const card = document.getElementById(`card-${time.replace(':', '')}`);
            if (card) {
                const updatedBtn = card.querySelector('.booking-btn');
                updatedBtn.textContent = '¡Reservado! ✓';
                updatedBtn.style.background = '#22c55e';
                setTimeout(() => {
                    updatedBtn.textContent = originalText;
                    updatedBtn.style.background = '';
                }, 2000);
            }
        } catch (error) {
            alert(error.message);
            btn.textContent = originalText;
        } finally {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    }

    async function procesarCancelacion(btn, classId) {
        if (!confirm('¿Seguro que quieres cancelar tu plaza?')) return;

        btn.classList.add('btn-loading');
        btn.disabled = true;

        try {
            const res = await fetch('http://localhost:3000/api/reservations/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idClase: classId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cancelar');
            }

            await generarHoras();
            await renderSummary();
        } catch (error) {
            alert(error.message);
        } finally {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    }

    async function renderSummary() {
        if (!summaryList) return;

        try {
            // 1. Obtener datos del usuario (para saber el plan)
            const userRes = await fetch(`http://localhost:3000/api/users/${user.idusuario || user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            // 2. Obtener Mis Reservas
            const resMy = await fetch('http://localhost:3000/api/reservations/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const myReservations = await resMy.json();
            // Preparar HTML del Resumen
            let summaryHTML = '';

            // Card de Plan
            if (userData && userData.plan_nombre) {
                const limit = userData.limite_semanal || 2;
                const used = myReservations.length;
                const percent = (used / limit) * 100;

                summaryHTML += `
                    <div class="plan-info-card">
                        <div class="plan-header">
                            <span class="plan-name">${userData.plan_nombre.toUpperCase()}</span>
                            <span class="plan-limit">${used} / ${limit} clases</span>
                        </div>
                        <div class="plan-progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percent, 100)}%; background: ${percent >= 100 ? '#ef4444' : 'var(--primary)'}"></div>
                        </div>
                        <p class="plan-footer">${percent >= 100 ? 'Límite alcanzado' : 'Créditos semanales'}</p>
                    </div>
                    <div style="height: 1px; background: var(--border-color); margin: 15px 0; opacity: 0.5;"></div>
                `;
            }

            if (myReservations.length === 0) {
                summaryHTML += '<p style="text-align:center; padding:20px; opacity:0.5; font-size:0.85rem;">No tienes reservas esta semana.</p>';
            } else {
                summaryHTML += myReservations.map(res => `
                    <div class="summary-item">
                        <div class="summary-item-info">
                            <span class="summary-item-date">${res.diaSemana}</span>
                            <span class="summary-item-time">${res.hora.slice(0, 5)}</span>
                        </div>
                        <button class="btn-remove-reservation" onclick="window.quitarReserva(${res.idClase})" title="Quitar reserva">
                            &times;
                        </button>
                    </div>
                `).join('');
            }

            summaryList.innerHTML = summaryHTML;

        } catch (err) {
            console.error('Error renderSummary:', err);
            summaryList.innerHTML = '<p>Error al cargar resumen.</p>';
        }
    }

    window.quitarReserva = (classId) => {
        const btn = document.querySelector(`.btn-remove-reservation[onclick*="${classId}"]`);
        procesarCancelacion(btn, classId);
    };

    function formatearFechaSimple(dateStr) {
        const [y, m, d] = dateStr.split('-');
        const date = new Date(y, m - 1, d);
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return `${dias[date.getDay()]} ${d}/${m}`;
    }

    function quitarReserva(date, time) {
        if (!confirm('¿Seguro que quieres quitar esta reserva?')) return;

        let reservations = JSON.parse(localStorage.getItem('misReservas') || '[]');
        reservations = reservations.filter(r => !(r.date === date && r.time === time));
        localStorage.setItem('misReservas', JSON.stringify(reservations));

        // Actualizar UI
        renderSummary();
        if (selectedDateInfo && selectedDateInfo.id === date) {
            generarHoras(new Date(date.replace(/-/g, '/')));
        }
    }

    function generarAvataresAleatorios() {
        return [];
    }

    // Inicializar los selectores
    generarDias();
    renderSummary();

    // Lógica para botones de scroll horizontal de días
    const scrollDaysLeft = document.getElementById('scroll-days-left');
    const scrollDaysRight = document.getElementById('scroll-days-right');
    if (scrollDaysLeft && scrollDaysRight && daysList) {
        scrollDaysLeft.onclick = () => {
            if (currentWeekOffset > 0) {
                currentWeekOffset--;
                generarDias();
            }
        };
        scrollDaysRight.onclick = () => {
            if (currentWeekOffset < 1) {
                currentWeekOffset++;
                generarDias();
            }
        };
    }


    // Navegación - Volver al menú de clases desde el formulario
    backToMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        reservaContainer.classList.add('hidden');
        setTimeout(() => {
            classMenuContainer.classList.remove('hidden');
        }, 300);
    });

    // Navegación - Volver al Dashboard desde el menú de clases
    backToWelcomeBtn.addEventListener('click', () => {
        window.location.href = '../welcome/index.html';
    });
});
