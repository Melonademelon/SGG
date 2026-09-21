document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Verificación de Sesión Existente ---
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario_logueado'));
    if (usuarioLogueado && usuarioLogueado.email) {
        window.location.href = 'dashboard.html';
        return;
    }

    // --- Referencias DOM ---
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Inputs Login
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');

    // Inputs Registro
    const regNombre = document.getElementById('reg-nombre');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');

    // --- 2. Persistencia del Modo Día/Noche (WCAG Contrast & Labeling) ---
    const applySavedTheme = () => {
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
        themeToggleBtn.textContent = isDark ? '☀️ Modo Día' : '🌙 Modo Noche';
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche');
    });

    applySavedTheme();

    // --- 3. Gestión Accesible de Pestañas (Tabs WCAG) ---
    const activarTab = (tabActivo, tabInactivo, formMostrar, formOcultar) => {
        tabActivo.classList.add('active');
        tabActivo.setAttribute('aria-selected', 'true');
        tabActivo.setAttribute('tabindex', '0');

        tabInactivo.classList.remove('active');
        tabInactivo.setAttribute('aria-selected', 'false');
        tabInactivo.setAttribute('tabindex', '-1');

        formMostrar.classList.remove('hidden');
        formMostrar.removeAttribute('aria-hidden');

        formOcultar.classList.add('hidden');
        formOcultar.setAttribute('aria-hidden', 'true');

        limpiarErrores();
    };

    tabLogin.addEventListener('click', () => activarTab(tabLogin, tabRegister, formLogin, formRegister));
    tabRegister.addEventListener('click', () => activarTab(tabRegister, tabLogin, formRegister, formLogin));

    // Navegación por teclado en Pestañas (Teclas Izquierda/Derecha)
    const handleTabKeydown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            if (document.activeElement === tabLogin) {
                tabRegister.focus();
                activarTab(tabRegister, tabLogin, formRegister, formLogin);
            } else {
                tabLogin.focus();
                activarTab(tabLogin, tabRegister, formLogin, formRegister);
            }
        }
    };

    tabLogin.addEventListener('keydown', handleTabKeydown);
    tabRegister.addEventListener('keydown', handleTabKeydown);

    // --- 4. Funciones Auxiliares de LocalStorage y Validación ---
    const obtenerUsuarios = () => JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
    const guardarUsuarios = (usuarios) => localStorage.setItem('usuarios_sgg', JSON.stringify(usuarios));

    const limpiarErrores = () => {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('input').forEach(input => input.setAttribute('aria-invalid', 'false'));
    };

    const marcarError = (inputEl, errorElId, mensaje) => {
        const errorEl = document.getElementById(errorElId);
        if (errorEl) errorEl.textContent = mensaje;
        if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
    };

    const validarEmailFormat = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // --- 5. Lógica de Inicio de Sesión ---
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarErrores();

        const emailVal = loginEmail.value.trim().toLowerCase();
        const passVal = loginPassword.value;
        let esValido = true;

        if (!emailVal || !validarEmailFormat(emailVal)) {
            marcarError(loginEmail, 'error-login-email', 'Ingrese un correo electrónico válido.');
            esValido = false;
        }

        if (!passVal) {
            marcarError(loginPassword, 'error-login-password', 'Ingrese su contraseña.');
            esValido = false;
        }

        if (!esValido) return;

        const usuarios = obtenerUsuarios();
        const usuarioEncontrado = usuarios.find(u => u.email === emailVal && u.password === passVal);

        if (usuarioEncontrado) {
            const sesionData = {
                email: usuarioEncontrado.email,
                nombre: usuarioEncontrado.nombre
            };
            localStorage.setItem('usuario_logueado', JSON.stringify(sesionData));
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('error-login-general').textContent = 'Credenciales incorrectas. Verifique correo y contraseña.';
        }
    });

    // --- 6. Lógica de Registro de Usuario ---
    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarErrores();

        const nombreVal = regNombre.value.trim();
        const emailVal = regEmail.value.trim().toLowerCase();
        const passVal = regPassword.value;
        let esValido = true;

        if (!nombreVal) {
            marcarError(regNombre, 'error-reg-nombre', 'Ingrese su nombre completo.');
            esValido = false;
        }

        if (!emailVal || !validarEmailFormat(emailVal)) {
            marcarError(regEmail, 'error-reg-email', 'Ingrese un correo electrónico válido.');
            esValido = false;
        }

        if (!passVal || passVal.length < 6) {
            marcarError(regPassword, 'error-reg-password', 'La contraseña debe tener al menos 6 caracteres.');
            esValido = false;
        }

        if (!esValido) return;

        const usuarios = obtenerUsuarios();
        const existe = usuarios.some(u => u.email === emailVal);

        if (existe) {
            marcarError(regEmail, 'error-reg-email', 'El correo electrónico ya se encuentra registrado.');
            return;
        }

        const nuevoUsuario = {
            nombre: nombreVal,
            email: emailVal,
            password: passVal
        };

        usuarios.push(nuevoUsuario);
        guardarUsuarios(usuarios);

        const sesionData = { email: nuevoUsuario.email, nombre: nuevoUsuario.nombre };
        localStorage.setItem('usuario_logueado', JSON.stringify(sesionData));
        window.location.href = 'dashboard.html';
    });
});