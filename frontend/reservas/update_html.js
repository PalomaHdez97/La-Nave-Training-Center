const fs = require('fs');
const path = 'c:/Users/palom/Desktop/practicas/frontend/reservas/index.html';
let html = fs.readFileSync(path, 'utf8');

const regex = /<div class="calendar-container">[\s\S]*?<\/div>\s*<\/div>/;

const replacement = `            <!-- Selector de Días y Horas -->
            <div class="mobile-calendar-container">
                <div class="calendar-header-info">
                    <div class="date-info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:10px; color:var(--text-muted)">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <div>
                            <span class="muted-label">DÍA</span>
                            <h3 id="current-date-display">Mañana, viernes 13/03</h3>
                        </div>
                    </div>
                </div>

                <div class="horizontal-scroll-section">
                    <button class="scroll-btn" id="scroll-days-left">&lt;</button>
                    <div class="scroll-list days-list" id="days-list">
                        <!-- JS generará los días -->
                    </div>
                    <button class="scroll-btn" id="scroll-days-right">&gt;</button>
                </div>

                <div class="horizontal-scroll-section no-arrows">
                    <div class="scroll-list times-list" id="times-list">
                        <!-- JS generará las horas -->
                    </div>
                </div>
            </div>

            <!-- Vista de Detalles de la Sesión -->
            <div class="session-details-card" id="session-details" style="display: none;">
                <div class="session-header">
                    <div class="session-title-wrapper">
                        <div class="accent-line"></div>
                        <h2>ENTRENAMIENTO<br>FUNCIONAL*</h2>
                    </div>
                    <h2 class="session-time-display" id="selected-time-display">07:00</h2>
                </div>
                <div class="users-grid" id="users-grid">
                    <!-- JS generará los 20 avatares -->
                </div>
                <button class="btn-primary" id="open-reserva-form" style="margin-top: 30px; width: 100%;">Reservar Plaza</button>
            </div>`;

html = html.replace(regex, replacement);
fs.writeFileSync(path, html);
console.log("HTML replaced successfully");
