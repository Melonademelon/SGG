document.addEventListener('DOMContentLoaded', () => {
    if (SGG.obtenerSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const formRegister = document.getElementById('form-register');
    const regNombre = document.getElementById('reg-nombre');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');

    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        SGG.limpiarErrores();

        const nombreVal = regNombre.value.trim();
        const emailVal = regEmail.value.trim().toLowerCase();
        const passVal = regPassword.value;
        let esValido = true;

        if (!nombreVal) {
            SGG.marcarError(regNombre, 'error-reg-nombre', 'Ingrese su nombre completo.');
            esValido = false;
        }

        if (!emailVal || !SGG.validarEmail(emailVal)) {
            SGG.marcarError(regEmail, 'error-reg-email', 'Ingrese un correo electrónico válido.');
            esValido = false;
        }

        if (!passVal || passVal.length < 6) {
            SGG.marcarError(regPassword, 'error-reg-password', 'La contraseña debe contener al menos 6 caracteres.');
            esValido = false;
        }

        if (!esValido) return;

        const usuarios = SGG.obtenerUsuarios();
        if (usuarios.some(u => u.email === emailVal)) {
            SGG.marcarError(regEmail, 'error-reg-email', 'El correo ya se encuentra registrado.');
            return;
        }

        usuarios.push({
            nombre: nombreVal,
            email: emailVal,
            password: passVal
        });

        SGG.guardarUsuarios(usuarios);
        SGG.guardarSesion({ email: emailVal, nombre: nombreVal });
        window.location.href = 'dashboard.html';
    });
});
