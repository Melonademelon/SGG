"use strict";

// --- OBJETO GLOBAL SGG (Autenticación y Utilidades) ---
window.SGG = {
    obtenerSesion: () => JSON.parse(localStorage.getItem("usuario_logueado")),
    crearSesion: (user) => localStorage.setItem("usuario_logueado", JSON.stringify({ email: user.email, nombre: user.nombre })),
    cerrarSesion: () => { 
        localStorage.removeItem("usuario_logueado"); 
        window.location.href = "login.html"; 
    },
    mostrarError: (idElemento, mensaje) => {
        const el = document.getElementById(idElemento);
        if (el) { el.textContent = mensaje; el.style.display = 'block'; }
    },
    limpiarErrores: () => {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. GESTIÓN DEL TEMA OCULTO
    const aplicarTema = (esOscuro) => {
        if(esOscuro) {
            document.body.classList.add("dark-mode");
            document.querySelectorAll(".fa-moon").forEach(i => i.classList.replace("fa-moon", "fa-sun"));
        } else {
            document.body.classList.remove("dark-mode");
            document.querySelectorAll(".fa-sun").forEach(i => i.classList.replace("fa-sun", "fa-moon"));
        }
    };

    aplicarTema(localStorage.getItem("theme_preference") === "dark");

    const themeBtns = document.querySelectorAll("#theme-toggle, #theme-toggle-btn");
    themeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const isDark = !document.body.classList.contains("dark-mode");
            localStorage.setItem("theme_preference", isDark ? "dark" : "light");
            aplicarTema(isDark);
        });
    });

    // 2. CORRECCIÓN DEL LAG DEL OJO (Uso de pointerdown para respuesta 0ms)
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("pointerdown", (e) => {
            e.preventDefault(); 
            const input = document.getElementById(btn.getAttribute("data-target"));
            const icon = btn.querySelector("i");
            
            input.type = input.type === "password" ? "text" : "password";
            icon.classList.toggle("fa-eye");
            icon.classList.toggle("fa-eye-slash");
        });
    });

    // 3. UTILIDAD PARA MENSAJES GLOBALES
    window.showMessage = function(elementId, text, type) {
        const msgEl = document.getElementById(elementId);
        if(msgEl) {
            msgEl.textContent = text;
            msgEl.className = `msg show ${type}`;
        }
    };
});
