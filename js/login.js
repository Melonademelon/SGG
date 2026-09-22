document.addEventListener("DOMContentLoaded", () => {
    // Protección y Redirección
    if (localStorage.getItem("usuario_activo") && window.location.pathname.includes("index.html")) {
        window.location.href = "./dashboard.html";
        return;
    }

    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    
    // Toggle formularios
    document.getElementById("link-register")?.addEventListener("click", (e) => {
        e.preventDefault();
        loginSection.classList.add("hidden");
        registerSection.classList.remove("hidden");
    });

    document.getElementById("link-login")?.addEventListener("click", (e) => {
        e.preventDefault();
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
    });

    // Toggle de visibilidad de contraseña
    const setupPasswordToggle = (toggleId, inputId) => {
        const toggleBtn = document.getElementById(toggleId);
        const inputField = document.getElementById(inputId);
        if (toggleBtn && inputField) {
            const toggleAction = () => {
                const isPassword = inputField.type === "password";
                inputField.type = isPassword ? "text" : "password";
                toggleBtn.classList.toggle("fa-eye");
                toggleBtn.classList.toggle("fa-eye-slash");
            };
            toggleBtn.addEventListener("click", toggleAction);
            toggleBtn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") toggleAction(); });
        }
    };

    setupPasswordToggle("toggle-login-pwd", "login-password");
    setupPasswordToggle("toggle-reg-pwd", "reg-password");

    // Lógica de Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const identifier = document.getElementById("login-identifier").value.trim().toLowerCase();
            const password = document.getElementById("login-password").value;
            
            // Simulación DB local
            const users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
            const user = users.find(u => u.username === identifier || u.email === identifier);

            if (user && user.password === password) {
                localStorage.setItem("usuario_activo", user.username);
                window.location.href = "./dashboard.html"; 
            } else {
                alert("Credenciales incorrectas."); // Simplificado para garantizar el flujo. 
            }
        });
    }
});
