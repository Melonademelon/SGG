let intentosFallidos = 0;
const loginForm = document.getElementById("login-form");

if(loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit-login");
        const identifier = document.getElementById("login-identifier").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        
        const users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
        const user = users.find(u => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier);

        if (user && user.password === password) {
            intentosFallidos = 0;
            showMessage("login-msg", `¡Bienvenido/a, ${user.nombre}! Redirigiendo al panel...`, "success");
            setTimeout(() => { alert("🚀 Sesión iniciada con éxito. Conexión con Dashboard establecida."); }, 1500);
        } else {
            intentosFallidos++;
            if (intentosFallidos >= 3) {
                btn.disabled = true;
                let timeLeft = 30;
                showMessage("login-msg", `Bloqueo de seguridad por intentos fallidos. Espera ${timeLeft}s.`, "error");
                
                const interval = setInterval(() => {
                    timeLeft--;
                    showMessage("login-msg", `Bloqueo de seguridad por intentos fallidos. Espera ${timeLeft}s.`, "error");
                    if (timeLeft <= 0) {
                        clearInterval(interval);
                        btn.disabled = false;
                        intentosFallidos = 0;
                        const msgDiv = document.getElementById("login-msg");
                        if(msgDiv) msgDiv.classList.remove("show");
                    }
                }, 1000);
            } else {
                showMessage("login-msg", "Las credenciales introducidas son incorrectas.", "error");
            }
        }
    });
}
