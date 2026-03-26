document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');

    // Comprobar si hay una sesión guardada
    const storedUser = localStorage.getItem('user');
    if (storedUser) {                   //SI STOREDUSER EXISTE, ES DECIR, SI HAY UNA SESIÓN GUARDADA, REDIRIGE A LA PANTALLA DE BIENVENIDA
        window.location.href = '../welcome/index.html';  //es la instrucción que cambia la URL actual del navegador por otra.
        return; // Detener la ejecución
    }


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar errores previos
        errorDiv.style.display = 'none';
        errorDiv.innerText = '';

        // Estado de carga
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;              //bloquea el botón para prevenir múltiples envíos

        const data = {
            username: emailInput.value.trim(),
            password: passwordInput.value
        };

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {      //como poner el código en pausa. Mientras el navegador espera a que el servidor responda
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {  //si usuarioo y contraseña correctos
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Marcar que es el primer login para mostrar la animación de bienvenida
                sessionStorage.setItem('firstLoginAfterLanding', 'true');

                setTimeout(() => {
                    if (result.user.is_admin) {
                        window.location.href = '../admin/index.html';
                    } else {
                        window.location.href = '../welcome/index.html';
                    }
                }, 600);   //se aplica un retraso en la transición a la pagina de bienvenida
            } else {
                showError(result.error || 'Correo o contraseña incorrectos.', errorDiv, loginForm);
                submitBtn.classList.remove('btn-loading');   //deja de mostrar icono de carga que se ha establecido en el css
                submitBtn.disabled = false;
            }
        } catch (error) {
            showError('Error de red. Asegúrate de que el servidor esté encendido.', errorDiv, loginForm);
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;    //vuelve a habilitar el botón 
        }
    });

    function showError(message, errorElement, formElement) {
        errorElement.innerText = message;
        errorElement.style.display = 'block';

        // Animación de "agitación" (shake) del formulario para indicar un error
        formElement.animate([           //usamos formElement de manera generica, refiriendose a todos los formularios en si
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 400, easing: 'ease-in-out' });
    }
    // Lógica para "¿Olvidaste tu contraseña?"
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Por favor, contacta con el administrador del centro para restablecer tu contraseña personalmente. Broadway');
        });
    }
});
