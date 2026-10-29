let intentosFallidos = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await window.AppDB.initDB();

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-submit-login");
      const identifier = document
        .getElementById("login-identifier")
        .value.trim()
        .toLowerCase();
      const password = document.getElementById("login-password").value;

      // Consulta SQL nativa
      const users = window.AppDB.query(
        `SELECT * FROM usuarios WHERE LOWER(username) = ? OR LOWER(email) = ?`,
        [identifier, identifier]
      );

      const user = users.length > 0 ? users[0] : null;

      if (user && user.password_hash === password) {
        intentosFallidos = 0;
        localStorage.setItem("usuario_activo_id", user.id_usuario);
        localStorage.setItem("usuario_activo_nombre", user.nombre);

        showMessage(
          "login-msg",
          `¡Bienvenido/a, ${user.nombre}! Redirigiendo al panel...`,
          "success"
        );
        setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 1200);
      } else {
        intentosFallidos++;
        if (intentosFallidos >= 3) {
          btn.disabled = true;
          let timeLeft = 30;
          showMessage(
            "login-msg",
            `Bloqueo de seguridad por intentos fallidos. Espera ${timeLeft}s.`,
            "error"
          );

          const interval = setInterval(() => {
            timeLeft--;
            showMessage(
              "login-msg",
              `Bloqueo de seguridad por intentos fallidos. Espera ${timeLeft}s.`,
              "error"
            );
            if (timeLeft <= 0) {
              clearInterval(interval);
              btn.disabled = false;
              intentosFallidos = 0;
              const msgDiv = document.getElementById("login-msg");
              if (msgDiv) msgDiv.classList.remove("show");
            }
          }, 1000);
        } else {
          showMessage(
            "login-msg",
            "Las credenciales introducidas son incorrectas.",
            "error"
          );
        }
      }
    });
  }
});
