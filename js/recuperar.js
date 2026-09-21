document.addEventListener('DOMContentLoaded', () => {
    const formRecuperar = document.getElementById('form-recuperar');
    const recEmail = document.getElementById('rec-email');
    const recNewPassword = document.getElementById('rec-new-password');

    formRecuperar.addEventListener('submit', (e) => {
        e.preventDefault();
        SGG.limpiarErrores();

        const emailVal = recEmail.value.trim().toLowerCase();
        const newPassVal = recNewPassword.value;
        let esValido = true;

        if (!emailVal || !SGG.validarEmail(emailVal)) {
            SGG.marcarError(recEmail, 'error-rec-email', 'Ingrese un correo electrónico válido.');
            esValido = false;
        }

        if (!newPassVal || newPassVal.length < 6) {
            SGG.marcarError(recNewPassword, 'error-rec-new-password', 'La contraseña debe tener al menos 6 caracteres.');
            esValido = false;
        }

        if (!esValido) return;

        const usuarios = SGG.obtenerUsuarios();
        const usuarioIndex = usuarios.findIndex(u => u.email === emailVal);

        if (usuarioIndex === -1) {
            SGG.marcarError(recEmail, 'error-rec-email', 'No existe ninguna cuenta asociada a este correo.');
            return;
        }

        usuarios[usuarioIndex].password = newPassVal;
        SGG.guardarUsuarios(usuarios);

        alert('Contraseña actualizada correctamente. Inicie sesión.');
        window.location.href = 'login.html';
    });
});
