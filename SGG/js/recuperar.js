let userToReset = null;

document.addEventListener("DOMContentLoaded", async () => {
  await window.AppDB.initDB();
});

function verifyUserForReset() {
  const username = document
    .getElementById("forgot-username")
    .value.trim()
    .toLowerCase();

  const users = window.AppDB.query(
    `SELECT * FROM usuarios WHERE LOWER(username) = ?`,
    [username]
  );

  if (users.length === 0) {
    return showMessage(
      "forgot-msg",
      "El usuario introducido no existe en el sistema.",
      "error"
    );
  }

  userToReset = users[0];

  const questionsMap = {
    mascota: "¿Nombre de tu primera mascota?",
    escuela: "¿Nombre de tu escuela primaria?",
    ciudad: "¿En qué ciudad naciste?"
  };

  document.getElementById("security-question-label").textContent =
    `Desafío: ${questionsMap[userToReset.question]}`;
  document.getElementById("step1-forgot").classList.add("hidden");
  document.getElementById("forgot-form").classList.remove("hidden");
  const msgDiv = document.getElementById("forgot-msg");
  if (msgDiv) msgDiv.classList.remove("show");
}

const forgotForm = document.getElementById("forgot-form");
if (forgotForm) {
  document
    .getElementById("forgot-new-password")
    .addEventListener("input", () => {
      validatePasswordRules(
        "forgot-new-password",
        "btn-submit-forgot",
        "f-req-"
      );
    });

  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const answer = document
      .getElementById("forgot-answer")
      .value.trim()
      .toLowerCase();
    const newPassword = document.getElementById("forgot-new-password").value;
    const newPasswordConfirm = document.getElementById(
      "forgot-new-password-confirm"
    ).value;

    if (answer !== userToReset.answer.toLowerCase()) {
      return showMessage(
        "forgot-msg",
        "La respuesta de seguridad es incorrecta.",
        "error"
      );
    }
    if (newPassword === userToReset.password_hash) {
      return showMessage(
        "forgot-msg",
        "No puedes usar tu contraseña actual como nueva.",
        "error"
      );
    }
    if (newPassword !== newPasswordConfirm) {
      return showMessage(
        "forgot-msg",
        "Las nuevas contraseñas no coinciden.",
        "error"
      );
    }

    // Actualizar clave en SQLite
    window.AppDB.db.run(
      `UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?`,
      [newPassword, userToReset.id_usuario]
    );
    window.AppDB.save();

    showMessage(
      "forgot-msg",
      "¡Contraseña restablecida con éxito! Redirigiendo...",
      "success"
    );
    setTimeout(() => (window.location.href = "./login.html"), 1500);
  });
}
