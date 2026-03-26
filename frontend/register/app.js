document.addEventListener('DOMContentLoaded', () => {
    // Elementos del Registro
    const registerForm = document.getElementById('registerForm');
    const regUsernameInput = document.getElementById('reg-username');
    const regEmailInput = document.getElementById('reg-email');
    const regPasswordInput = document.getElementById('reg-password');
    const regErrorDiv = document.getElementById('reg-error-message');
    const regSuccessDiv = document.getElementById('reg-success-message');
    const regSubmitBtn = document.getElementById('reg-submit-btn');

    // Comprobar si hay una sesión guardada
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
        window.location.href = '../welcome/index.html';
        return; // Detener la ejecución
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        regErrorDiv.style.display = 'none';
        regErrorDiv.innerText = '';
        regSuccessDiv.style.display = 'none';
        regSuccessDiv.innerText = '';

        regSubmitBtn.classList.add('btn-loading');
        regSubmitBtn.disabled = true;

        const data = {
            username: regUsernameInput.value.trim(),
            email: regEmailInput.value.trim(),
            password: regPasswordInput.value
        };

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                setTimeout(() => {
                    regSuccessDiv.innerText = '¡Registro exitoso! Redirigiendo al inicio de sesión...';
                    regSuccessDiv.style.display = 'block';
                    regSubmitBtn.classList.remove('btn-loading');
                    regSubmitBtn.disabled = false;
                    registerForm.reset();

                    // Volver al login tras 2.5 segundos
                    setTimeout(() => {
                        window.location.href = '../login/index.html';
                    }, 2500);
                }, 600);
            } else {
                showError(result.error || 'Error al registrar usuario.', regErrorDiv, registerForm);
                regSubmitBtn.classList.remove('btn-loading');
                regSubmitBtn.disabled = false;
            }
        } catch (error) {
            showError('Error de red al intentar registrar.', regErrorDiv, registerForm);
            regSubmitBtn.classList.remove('btn-loading');
            regSubmitBtn.disabled = false;
        }
    });

    function showError(message, errorElement, formElement) {
        errorElement.innerText = message;
        errorElement.style.display = 'block';

        // Animación de "agitación" (shake) del formulario para indicar un error
        formElement.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 400, easing: 'ease-in-out' });
    }
});
