const registerForm = document.getElementById("register-form");

if(registerForm) {
    // Escucha en tiempo real para activar/desactivar el botón según las reglas
    document.getElementById("reg-password").addEventListener("input", () => {
        validatePasswordRules('reg-password', 'btn-submit-reg', 'req-');
    });

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const name = document.getElementById("reg-name").value.trim();
        const surname = document.getElementById("reg-surname").value.trim();
        const dob = document.getElementById("reg-dob").value;
        const email = document.getElementById("reg-email").value.trim();
        const username = document.getElementById("reg-username").value.trim();
        const password = document.getElementById("reg-password").value;
        const passwordConfirm = document.getElementById("reg-password-confirm").value;
        const question = document.getElementById("reg-question").value;
        const answer = document.getElementById("reg-answer").value.trim();

        // Validar que nombre y apellido no tengan símbolos o números
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nameRegex.test(name) || !nameRegex.test(surname)) {
            return showMessage("register-msg", "Los nombres y apellidos no pueden contener números ni caracteres especiales.", "error");
        }

        // Mayoría de edad (+14 años)
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
        if (age < 14) return showMessage("register-msg", "Registro denegado. Debes ser mayor de 14 años.", "error");

        // Formato regex de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return showMessage("register-msg", "El formato del correo electrónico es inválido.", "error");

        // Contraseñas idénticas
        if (password !== passwordConfirm) return showMessage("register-msg", "Las contraseñas ingresadas no coinciden.", "error");

        let users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
        
        // Verificar duplicados sin importar mayúsculas
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return showMessage("register-msg", "El nombre de usuario elegido ya se encuentra registrado.", "error");
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return showMessage("register-msg", "Este correo electrónico ya está vinculado a otra cuenta.", "error");

        // Guardar usuario
        users.push({ nombre: name, apellido: surname, dob, email, username, password, question, answer });
        localStorage.setItem("usuarios_sgg", JSON.stringify(users));

        showMessage("register-msg", "¡Cuenta creada con éxito! Redirigiendo...", "success");
        setTimeout(() => window.location.href = "./login.html", 2000);
    });
}