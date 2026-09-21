// Funciones globales y soporte común (Ortogonalidad)
const SGG = {
    obtenerUsuarios: () => JSON.parse(localStorage.getItem('usuarios_sgg')) || [],
    guardarUsuarios: (usuarios) => localStorage.setItem('usuarios_sgg', JSON.stringify(usuarios)),
    obtenerSesion: () => JSON.parse(localStorage.getItem('usuario_logueado')),
    guardarSesion: (data) => localStorage.setItem('usuario_logueado', JSON.stringify(data)),
    cerrarSesion: () => {
        localStorage.removeItem('usuario_logueado');
        window.location.href = 'login.html';
    },
    validarEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    limpiarErrores: () => {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('input, select').forEach(el => el.setAttribute('aria-invalid', 'false'));
    },
    marcarError: (inputEl, errorElId, mensaje) => {
        const errorEl = document.getElementById(errorElId);
        if (errorEl) errorEl.textContent = mensaje;
        if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Control Global del Tema (Modo Día / Noche)
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const aplicarTema = () => {
            const theme = localStorage.getItem('sgg_theme') || 'light';
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                themeToggleBtn.textContent = '☀️ Modo Día';
                themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo día');
            } else {
                document.body.classList.remove('dark-mode');
                themeToggleBtn.textContent = '🌙 Modo Noche';
                themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo noche');
            }
        };

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('sgg_theme', isDark ? 'dark' : 'light');
            aplicarTema();
        });

        aplicarTema();
    }
});
