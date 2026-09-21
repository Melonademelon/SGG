document.addEventListener('DOMContentLoaded', () => {
    // Si ya existe sesión, redirigir al dashboard
    if (SGG.obtenerSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const formLogin = document.getElementById('form-login');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        SGG.limpiarErrores();

        const emailVal = loginEmail.value.trim().toLowerCase();
        const passVal = loginPassword.value;
        let esValido = true;

        if (!emailVal || !SGG.validarEmail(emailVal)) {
            SGG.marcarError(loginEmail, 'error-login-email', 'Ingrese un correo electrónico válido.');
            esValido = false;
        }

        if (!passVal) {
            SGG.marcarError(loginPassword, 'error-login-password', 'Ingrese su contraseña.');
            esValido = false;
        }

        if (!esValido) return;

        const usuarios = SGG.obtenerUsuarios();
        const usuarioEncontrado = usuarios.find(u => u.email === emailVal && u.password === passVal);

        if (usuarioEncontrado) {
            SGG.guardarSesion({
                email: usuarioEncontrado.email,
                nombre: usuarioEncontrado.nombre
            });
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('error-login-general').textContent = 'Credenciales incorrectas. Verifique sus datos.';
        }
    });
});
