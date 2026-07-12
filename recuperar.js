let userToReset = null;

// Hacemos la función global para que el HTML pueda llamarla en el onclick
window.verifyUserForReset = function() {
    const username = document.getElementById("forgot-username").value.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
    userToReset = users.find(u => u.username.toLowerCase() === username);

    if (!userToReset) return showMessage("forgot-msg", "El usuario no existe.", "error");

    const questionsMap = { 
        mascota: "¿Nombre de tu primera mascota?", 
        escuela: "¿Nombre de tu escuela primaria?", 
        ciudad: "¿En qué ciudad naciste?" 
    };
    document.getElementById("security-question-label").textContent = `Desafío: ${questionsMap[userToReset.question]}`;
    
    document.getElementById("step1-forgot").classList.add("hidden");
    document.getElementById("step2-forgot").classList.remove("hidden");
    document.getElementById("forgot-msg").classList.remove("show");
}

const forgotForm = document.getElementById("forgot-form");
if(forgotForm) {
    document.getElementById("forgot-new-password").addEventListener("input", () => {
        validatePasswordRules('forgot-new-password', 'btn-submit-forgot', 'f-req-');
    });

    forgotForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const answer = document.getElementById("forgot-answer").value.trim();
        const newPassword = document.getElementById("forgot-new-password").value;
        const newPasswordConfirm = document.getElementById("forgot-new-password-confirm").value;

        if (answer.toLowerCase() !== userToReset.answer.toLowerCase()) return showMessage("forgot-msg", "Respuesta de seguridad incorrecta.", "error");
        if (newPassword === userToReset.password) return showMessage("forgot-msg", "No puedes usar tu contraseña actual.", "error");
        if (newPassword !== newPasswordConfirm) return showMessage("forgot-msg", "Las contraseñas nuevas no coinciden.", "error");

        let users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
        users = users.map(u => { 
            if (u.username === userToReset.username) u.password = newPassword; 
            return u; 
        });
        localStorage.setItem("usuarios_sgg", JSON.stringify(users));

        showMessage("forgot-msg", "Contraseña restablecida. Redirigiendo al login...", "success");
        setTimeout(() => window.location.href = "login.html", 2000);
    });
}