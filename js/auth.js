"use strict";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Sesión Existente
    // Utiliza el motor global SGG definido en main.js
    if (SGG.obtenerSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Referencias DOM - Pestañas
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    // Inputs Login
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');

    // Inputs Registro
    const regNombre = document.getElementById('reg-nombre');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');

    // 2. Gestión Accesible de Pestañas (Tabs WCAG)
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

        // Limpiamos los errores visuales al cambiar de pestaña
        SGG.limpiarErrores();
        document.querySelectorAll('input').forEach(input => input.setAttribute('aria-invalid', 'false'));
    };

    if (tabLogin && tabRegister) {
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
    }

    // Funciones Auxiliares locales
    const obtenerUsuarios = () => JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
    const guardarUsuarios = (usuarios) => localStorage.setItem('usuarios_sgg', JSON.stringify(usuarios));
    const validarEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // 3. Lógica de Inicio de Sesión
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            SGG.limpiarErrores();
            document.querySelectorAll('input').forEach(i => i.setAttribute('aria-invalid', 'false'));

            const emailVal = loginEmail.value.trim().toLowerCase();
            const passVal = loginPassword.value;
            let esValido = true;

            if (!emailVal || !validarEmailFormat(emailVal)) {
                SGG.mostrarError('error-login-email', 'Ingrese un correo electrónico válido.');
                loginEmail.setAttribute('aria-invalid', 'true');
                esValido = false;
            }

            if (!passVal) {
                SGG.mostrarError('error-login-password', 'Ingrese su contraseña.');
                loginPassword.setAttribute('aria-invalid', 'true');
                esValido = false;
            }

            if (!esValido) return;

            const usuarios = obtenerUsuarios();
            const usuarioEncontrado = usuarios.find(u => u.email === emailVal && u.password === passVal);

            if (usuarioEncontrado) {
                SGG.crearSesion(usuarioEncontrado);
                window.location.href = 'dashboard.html';
            } else {
                SGG.mostrarError('error-login-general', 'Credenciales incorrectas. Verifique correo y contraseña.');
            }
        });
    }

    // 4. Lógica de Registro de Usuario
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            SGG.limpiarErrores();
            document.querySelectorAll('input').forEach(i => i.setAttribute('aria-invalid', 'false'));

            const nombreVal = regNombre.value.trim();
            const emailVal = regEmail.value.trim().toLowerCase();
            const passVal = regPassword.value;
            let esValido = true;

            if (!nombreVal) {
                SGG.mostrarError('error-reg-nombre', 'Ingrese su nombre completo.');
                regNombre.setAttribute('aria-invalid', 'true');
                esValido = false;
            }

            if (!emailVal || !validarEmailFormat(emailVal)) {
                SGG.mostrarError('error-reg-email', 'Ingrese un correo electrónico válido.');
                regEmail.setAttribute('aria-invalid', 'true');
                esValido = false;
            }

            if (!passVal || passVal.length < 6) {
                SGG.mostrarError('error-reg-password', 'La contraseña debe tener al menos 6 caracteres.');
                regPassword.setAttribute('aria-invalid', 'true');
                esValido = false;
            }

            if (!esValido) return;

            const usuarios = obtenerUsuarios();
            const existe = usuarios.some(u => u.email === emailVal);

            if (existe) {
                SGG.mostrarError('error-reg-email', 'El correo electrónico ya se encuentra registrado.');
                regEmail.setAttribute('aria-invalid', 'true');
                return;
            }

            const nuevoUsuario = {
                nombre: nombreVal,
                email: emailVal,
                password: passVal,
                activo: true
            };

            usuarios.push(nuevoUsuario);
            guardarUsuarios(usuarios);

            SGG.crearSesion(nuevoUsuario);
            window.location.href = 'dashboard.html';
        });
    }
});
