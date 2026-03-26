const fs = require('fs');
const path = 'c:/Users/palom/Desktop/practicas/frontend/reservas/index.html';
let html = fs.readFileSync(path, 'utf8');

// Replace the table
const regex = /<div class="calendar-table-wrapper">[\s\S]*?<\/table>\s*<\/div>/;
const replacement = `<div class="calendar-table-wrapper" id="timetable-container">\n                    <!-- Javascript generará la tabla aquí -->\n                </div>`;

html = html.replace(regex, replacement);

// Also replace the auth-header
const authRegex = /<p id="selected-class-name"[^>]*>[\s\S]*?<\/p>/;
const authReplacement = `<p id="selected-class-name" style="color: var(--primary); font-weight: 600; margin-top: 5px;">\n                    <!-- Javascript insertará aquí la clase --></p>`;
html = html.replace(authRegex, authReplacement);

fs.writeFileSync(path, html);
console.log("HTML replaced successfully");
