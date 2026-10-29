document.addEventListener("DOMContentLoaded", async () => {
  await window.AppDB.initDB();

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    document.getElementById("reg-password").addEventListener("input", () => {
      validatePasswordRules("reg-password", "btn-submit-reg", "req-");
    });

    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("reg-name").value.trim();
      const surname = document.getElementById("reg-surname").value.trim();
      const dob = document.getElementById("reg-dob").value;
      const email = document
        .getElementById("reg-email")
        .value.trim()
        .toLowerCase();
      const username = document
        .getElementById("reg-username")
        .value.trim()
        .toLowerCase();
      const password = document.getElementById("reg-password").value;
      const passwordConfirm = document.getElementById(
        "reg-password-confirm"
      ).value;
      const question = document.getElementById("reg-question").value;
      const answer = document
        .getElementById("reg-answer")
        .value.trim()
        .toLowerCase();

      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!nameRegex.test(name) || !nameRegex.test(surname)) {
        return showMessage(
          "register-msg",
          "Los nombres y apellidos no pueden contener números ni caracteres especiales.",
          "error"
        );
      }

      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() < birthDate.getDate())
      )
        age--;
      if (age < 14)
        return showMessage(
          "register-msg",
          "Registro denegado. Debes ser mayor de 14 años.",
          "error"
        );

      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email))
        return showMessage(
          "register-msg",
          "El formato del correo electrónico es inválido.",
          "error"
        );

      if (password !== passwordConfirm)
        return showMessage(
          "register-msg",
          "Las contraseñas ingresadas no coinciden.",
          "error"
        );

      // Comprobar existencia en SQLite
      const existingUser = window.AppDB.query(
        `SELECT * FROM usuarios WHERE LOWER(username) = ? OR LOWER(email) = ?`,
        [username, email]
      );

      if (existingUser.length > 0) {
        return showMessage(
          "register-msg",
          "El usuario o correo electrónico ya se encuentra registrado.",
          "error"
        );
      }

      // Inserción de Usuario en la Base de Datos
      try {
        window.AppDB.db.run(
          `INSERT INTO usuarios (nombre, apellido, dob, email, username, password_hash, question, answer)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, surname, dob, email, username, password, question, answer]
        );
        window.AppDB.save();

        showMessage(
          "register-msg",
          "¡Cuenta creada con éxito! Redirigiendo...",
          "success"
        );
        setTimeout(() => (window.location.href = "./login.html"), 1500);
      } catch (err) {
        showMessage(
          "register-msg",
          "Error guardando en BD: " + err.message,
          "error"
        );
      }
    });
  }
});
