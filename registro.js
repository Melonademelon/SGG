const registerForm = document.getElementById("register-form");

if(registerForm) {
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

        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nameRegex.test(name) || !nameRegex.test(surname)) return showMessage("register-msg", "Nombres y apellidos no pueden tener números ni símbolos.", "error");

        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
        if (age < 14) return showMessage("register-msg", "Registro denegado. Debes tener más de 14 años.", "error");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return showMessage("register-msg", "Formato de correo inválido.", "error");

        if (password !== passwordConfirm) return showMessage("register-msg", "Las contraseñas no coinciden.", "error");

        let users = JSON.parse(localStorage.getItem("usuarios_sgg")) || [];
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return showMessage("register-msg", "El nombre de usuario ya existe.", "error");
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return showMessage("register-msg", "El correo ya está registrado.", "error");

        users.push({ nombre: name, apellido: surname, dob, email, username, password, question, answer });
        localStorage.setItem("usuarios_sgg", JSON.stringify(users));

        showMessage("register-msg", "¡Registro exitoso! Redirigiendo...", "success");
        setTimeout(() => window.location.href = "login.html", 2000);
    });
}