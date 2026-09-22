let userToReset = null;

function verifyUserForReset() {
    const username = document.getElementById("forgot-username").value.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
    userToReset = users.find(u => u.username.toLowerCase() === username);

    if (!userToReset) return showMessage("forgot-msg", "El usuario introducido no existe en el sistema.", "error");

    const questionsMap = { 
        mascota: "¿Nombre de tu primera mascota?", 
        escuela: "¿Nombre de tu escuela primaria?", 
        ciudad: "¿En qué ciudad naciste?" 
    };
    
    // Inyectar la pregunta guardada
    document.getElementById("security-question-label").textContent = `Desafío: ${questionsMap[userToReset.question]}`;
    
    // Pasar del paso 1 al paso 2 ocultando con la clase CSS .hidden
    document.getElementById("step1-forgot").classList.add("hidden");
    document.getElementById("forgot-form").classList.remove("hidden");
    const msgDiv = document.getElementById("forgot-msg");
    if(msgDiv) msgDiv.classList.remove("show");
}

const forgotForm = document.getElementById("forgot-form");
if(forgotForm) {
    // Escucha en tiempo real de los 5 requisitos para la clave de recuperación
    document.getElementById("forgot-new-password").addEventListener("input", () => {
        validatePasswordRules('forgot-new-password', 'btn-submit-forgot', 'f-req-');
    });

    forgotForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const answer = document.getElementById("forgot-answer").value.trim();
        const newPassword = document.getElementById("forgot-new-password").value;
        const newPasswordConfirm = document.getElementById("forgot-new-password-confirm").value;

        if (answer.toLowerCase() !== userToReset.answer.toLowerCase()) {
            return showMessage("forgot-msg", "La respuesta de seguridad es incorrecta.", "error");
        }
        if (newPassword === userToReset.password) {
            return showMessage("forgot-msg", "No puedes usar tu contraseña actual como nueva.", "error");
        }
        if (newPassword !== newPasswordConfirm) {
            return showMessage("forgot-msg", "Las nuevas contraseñas no coinciden.", "error");
        }

        // Actualizar la clave en la base de datos
        let users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
        users = users.map(u => { 
            if (u.username.toLowerCase() === userToReset.username.toLowerCase()) u.password = newPassword; 
            return u; 
        });
        localStorage.setItem("usuarios_sgg", JSON.stringify(users));

        showMessage("forgot-msg", "¡Contraseña restablecida con éxito! Redirigiendo...", "success");
        setTimeout(() => window.location.href = "./login.html", 2000);
    });
}