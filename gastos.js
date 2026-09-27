document.addEventListener("DOMContentLoaded", async () => {
  await window.AppDB.initDB();

  const currentUserId = localStorage.getItem("usuario_activo_id");
  const currentUserName = localStorage.getItem("usuario_activo_nombre");

  if (!currentUserId) {
    window.location.href = "./login.html";
    return;
  }

  document.getElementById("user-greeting").textContent =
    `¡Hola, ${currentUserName}!`;
  document.getElementById("gasto-fecha").valueAsDate = new Date();

  const formGastos = document.getElementById("form-gastos");
  const listaGastos = document.getElementById("lista-gastos");
  const totalGastosEl = document.getElementById("total-gastos");

  const renderizarGastos = () => {
    listaGastos.innerHTML = "";

    // Consulta SQL con la Clave Foránea y Soft Delete
    const misGastos = window.AppDB.query(
      `SELECT * FROM gastos WHERE id_usuario = ? AND estado_activo = 1 ORDER BY fecha_gasto DESC`,
      [currentUserId]
    );

    let total = 0;
    if (misGastos.length === 0) {
      listaGastos.innerHTML = `<p style="text-align:center; opacity:0.6; margin-top:20px;">No hay gastos registrados aún.</p>`;
      totalGastosEl.textContent = `$0.00`;
      return;
    }

    const fragment = document.createDocumentFragment();
    misGastos.forEach((gasto) => {
      total += gasto.monto;
      const item = document.createElement("div");
      item.className = "gasto-card-item";
      item.innerHTML = `
                <div>
                    <strong style="font-size:1.1rem;">${gasto.descripcion}</strong>
                    <br>
                    <small style="opacity:0.7;">${gasto.categoria} • ${gasto.fecha_gasto}</small>
                </div>
                <div class="gasto-actions" style="display:flex; gap:10px; align-items:center;">
                    <span style="font-weight:bold; font-size:1.2rem; margin-right:10px;">$${gasto.monto.toFixed(2)}</span>
                    <button class="btn-solid btn-edit" data-id="${gasto.id_gasto}"><i class="fas fa-edit"></i></button>
                    <button class="btn-solid btn-danger btn-delete" data-id="${gasto.id_gasto}"><i class="fas fa-trash"></i></button>
                </div>
            `;
      fragment.appendChild(item);
    });
    listaGastos.appendChild(fragment);
    totalGastosEl.textContent = `$${total.toFixed(2)}`;
  };

  formGastos.addEventListener("submit", (e) => {
    e.preventDefault();
    const idGasto = document.getElementById("gasto-id").value;
    const desc = document.getElementById("gasto-desc").value.trim();
    const monto = parseFloat(document.getElementById("gasto-monto").value);
    const cat = document.getElementById("gasto-cat").value;
    const fecha = document.getElementById("gasto-fecha").value;

    if (monto <= 0 || isNaN(monto)) return;

    if (idGasto) {
      window.AppDB.db.run(
        `UPDATE gastos SET descripcion = ?, monto = ?, categoria = ?, fecha_gasto = ? WHERE id_gasto = ? AND id_usuario = ?`,
        [desc, monto, cat, fecha, idGasto, currentUserId]
      );
    } else {
      window.AppDB.db.run(
        `INSERT INTO gastos (id_usuario, descripcion, monto, categoria, fecha_gasto) VALUES (?, ?, ?, ?, ?)`,
        [currentUserId, desc, monto, cat, fecha]
      );
    }

    window.AppDB.save();
    renderizarGastos();
    salirModoEdicion();
  });

  listaGastos.addEventListener("click", (e) => {
    const btnEdit = e.target.closest(".btn-edit");
    const btnDel = e.target.closest(".btn-delete");

    if (btnEdit) {
      const gastoId = btnEdit.dataset.id;
      const res = window.AppDB.query(
        `SELECT * FROM gastos WHERE id_gasto = ?`,
        [gastoId]
      );
      if (res.length > 0) {
        const g = res[0];
        document.getElementById("gasto-id").value = g.id_gasto;
        document.getElementById("gasto-desc").value = g.descripcion;
        document.getElementById("gasto-monto").value = g.monto;
        document.getElementById("gasto-cat").value = g.categoria;
        document.getElementById("gasto-fecha").value = g.fecha_gasto;
        document.getElementById("form-title").textContent = "Editar Gasto";
        document.getElementById("btn-cancel-edit").classList.remove("hidden");
      }
    }

    if (btnDel) {
      if (confirm("¿Deseas borrar este gasto de tu cuenta?")) {
        // Soft Delete
        window.AppDB.db.run(
          `UPDATE gastos SET estado_activo = 0 WHERE id_gasto = ? AND id_usuario = ?`,
          [btnDel.dataset.id, currentUserId]
        );
        window.AppDB.save();
        renderizarGastos();
      }
    }
  });

  const salirModoEdicion = () => {
    document.getElementById("gasto-id").value = "";
    document.getElementById("form-title").textContent = "Registrar Gasto";
    document.getElementById("btn-cancel-edit").classList.add("hidden");
    formGastos.reset();
    document.getElementById("gasto-fecha").valueAsDate = new Date();
  };

  document
    .getElementById("btn-cancel-edit")
    .addEventListener("click", salirModoEdicion);

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("usuario_activo_id");
    localStorage.removeItem("usuario_activo_nombre");
    window.location.href = "./login.html";
  });

  renderizarGastos();
});
