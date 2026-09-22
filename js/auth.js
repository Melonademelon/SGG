"use strict";

document.addEventListener('DOMContentLoaded', () => {
    if (SGG.obtenerSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Navegación por pestañas
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    const activarTab = (tabActivo, tabInactivo, formMostrar, formOcultar) => {
        tabActivo.classList.add('active');
        tabActivo.setAttribute('aria-selected', 'true');
        tabInactivo.classList.remove('active');
        tabInactivo.setAttribute('aria-selected', 'false');
        
        formMostrar.classList.remove('hidden');
        formOcultar.classList.add('hidden');
        SGG.limpiarErrores();
    };

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => activarTab(tabLogin, tabRegister, formLogin, formRegister));
        tabRegister.addEventListener('click', () => activarTab(tabRegister, tabLogin, formRegister, formLogin));
    }

    // Utilidades
    const obtenerUsuarios = () => JSON.parse(localStorage.getItem('usuarios_sgg')) || [];
    const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Validación en tiempo real para la contraseña
    const regPassword = document.getElementById('reg-password');
    if (regPassword) {
        regPassword.addEventListener('input', (e) => {
            const val = e.target.value;
            
            // Reglas
            const rules = {
                length: val.length >= 8,
                upper: /[A-Z]/.test(val),
                lower: /[a-z]/.test(val),
                number: /[0-9]/.test(val),
                special: /[^A-Za-z0-9]/.test(val)
            };

            // Actualización visual
            document.getElementById('rule-length').classList.toggle('valid', rules.length);
            document.getElementById('rule-upper').classList.toggle('valid', rules.upper);
            document.getElementById('rule-lower').classList.toggle('valid', rules.lower);
            document.getElementById('rule-number').classList.toggle('valid', rules.number);
            document.getElementById('rule-special').classList.toggle('valid', rules.special);
        });
    }

    // Envío Login
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            SGG.limpiarErrores();

            const emailVal = document.getElementById('login-email').value.trim().toLowerCase();
            const passVal = document.getElementById('login-password').value;

            if (!emailVal || !validarEmail(emailVal)) {
                return SGG.mostrarError('error-login-email', 'Correo inválido.');
            }
            if (!passVal) {
                return SGG.mostrarError('error-login-password', 'Contraseña requerida.');
            }

            const usuario = obtenerUsuarios().find(u => u.email === emailVal && u.password === passVal);
            if (usuario) {
                SGG.crearSesion(usuario);
                window.location.href = 'dashboard.html';
            } else {
                SGG.mostrarError('error-login-general', 'Credenciales incorrectas.');
            }
        });
    }

    // Envío Registro
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            SGG.limpiarErrores();

            const nombreVal = document.getElementById('reg-nombre').value.trim();
            const emailVal = document.getElementById('reg-email').value.trim().toLowerCase();
            const passVal = regPassword.value;

            if (!nombreVal) return SGG.mostrarError('error-reg-nombre', 'Nombre requerido.');
            if (!emailVal || !validarEmail(emailVal)) return SGG.mostrarError('error-reg-email', 'Correo inválido.');

            // Validar que todas las reglas de contraseña se cumplan
            const passwordValida = passVal.length >= 8 && /[A-Z]/.test(passVal) && /[a-z]/.test(passVal) && /[0-9]/.test(passVal) && /[^A-Za-z0-9]/.test(passVal);
            
            if (!passwordValida) {
                return SGG.mostrarError('error-reg-password', 'La contraseña no cumple todos los requisitos.');
            }

            const usuarios = obtenerUsuarios();
            if (usuarios.some(u => u.email === emailVal)) {
                return SGG.mostrarError('error-reg-email', 'El correo ya está registrado.');
            }

            const nuevoUsuario = { nombre: nombreVal, email: emailVal, password: passVal, activo: true };
            usuarios.push(nuevoUsuario);
            localStorage.setItem('usuarios_sgg', JSON.stringify(usuarios));

            SGG.crearSesion(nuevoUsuario);
            window.location.href = 'dashboard.html';
        });
    }
});
