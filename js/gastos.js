document.addEventListener("DOMContentLoaded", async () => {
    await window.AppDB.initDB();

    const currentUserId = localStorage.getItem("usuario_activo_id");
    const currentUserName = localStorage.getItem("usuario_activo_nombre");

    if (!currentUserId) {
        window.location.href = "./login.html";
        return;
    }

    document.getElementById("user-greeting").textContent = `¡Hola, ${currentUserName}!`;
    document.getElementById("gasto-fecha").valueAsDate = new Date();

    const formGastos = document.getElementById("form-gastos");
    const tipoSelect = document.getElementById("gasto-tipo");
    const catSelect = document.getElementById("gasto-cat");
    const listaGastos = document.getElementById("lista-gastos");
    
    const totalIngresosEl = document.getElementById("total-ingresos");
    const totalEgresosEl = document.getElementById("total-egresos");
    const balanceTotalEl = document.getElementById("balance-total");

    let chartSemanalInstance = null;
    let chartMensualInstance = null;

    // Categorías dinámicas según el tipo elegido
    const categoriasPorTipo = {
        Egreso: ["Alimentación", "Transporte", "Servicios", "Entretenimiento", "Otros"],
        Ingreso: ["Sueldo / Salario", "Freelance / Ventas", "Inversiones", "Regalos / Premios", "Otros Ingresos"]
    };

    const actualizarCategoriasSelect = () => {
        const tipo = tipoSelect.value;
        catSelect.innerHTML = "";
        categoriasPorTipo[tipo].forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });
    };

    tipoSelect.addEventListener("change", actualizarCategoriasSelect);
    actualizarCategoriasSelect();

    // 1. Gráfico Semanal (Barras: Ingresos vs Egresos por día)
    const actualizarGraficoSemanal = (misMovimientos) => {
        const ctx = document.getElementById("chartSemanal").getContext("2d");
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const ingresosPorDia = [0, 0, 0, 0, 0, 0, 0];
        const egresosPorDia = [0, 0, 0, 0, 0, 0, 0];

        const hoy = new Date();
        const hace7Dias = new Date();
        hace7Dias.setDate(hoy.getDate() - 6);

        misMovimientos.forEach(m => {
            const fecha = new Date(m.fecha_gasto + "T00:00:00");
            if (fecha >= hace7Dias && fecha <= hoy) {
                const diaIndice = fecha.getDay();
                if (m.tipo === "Ingreso") ingresosPorDia[diaIndice] += m.monto;
                else egresosPorDia[diaIndice] += m.monto;
            }
        });

        if (chartSemanalInstance) chartSemanalInstance.destroy();

        const isDarkMode = document.body.classList.contains("dark-mode");
        const textColor = isDarkMode ? "#f5f2ec" : "#2d2a26";

        chartSemanalInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: diasSemana,
                datasets: [
                    { label: "Ingresos", data: ingresosPorDia, backgroundColor: "#6b9080", borderRadius: 4 },
                    { label: "Egresos", data: egresosPorDia, backgroundColor: "#d8708a", borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor, font: { family: "Plus Jakarta Sans", size: 10 }, boxWidth: 10 } }
                },
                scales: {
                    x: { ticks: { color: textColor, font: { family: "Plus Jakarta Sans", size: 9 } } },
                    y: { ticks: { color: textColor, font: { family: "Plus Jakarta Sans", size: 9 } } }
                }
            }
        });
    };

    // 2. Gráfico Mensual (Dona: Ingresos vs Egresos Totales del Mes)
    const actualizarGraficoMensual = (misMovimientos) => {
        const ctx = document.getElementById("chartMensual").getContext("2d");
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();

        let totalIngresosMes = 0;
        let totalEgresosMes = 0;

        misMovimientos.forEach(m => {
            const fecha = new Date(m.fecha_gasto + "T00:00:00");
            if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
                if (m.tipo === "Ingreso") totalIngresosMes += m.monto;
                else totalEgresosMes += m.monto;
            }
        });

        if (chartMensualInstance) chartMensualInstance.destroy();

        if (totalIngresosMes === 0 && totalEgresosMes === 0) return;

        const isDarkMode = document.body.classList.contains("dark-mode");
        const textColor = isDarkMode ? "#f5f2ec" : "#2d2a26";

        chartMensualInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Ingresos", "Egresos"],
                datasets: [{
                    data: [totalIngresosMes, totalEgresosMes],
                    backgroundColor: ["#6b9080", "#d8708a"],
                    borderWidth: 2,
                    borderColor: isDarkMode ? "#211e1b" : "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: textColor, font: { family: "Plus Jakarta Sans", size: 10 }, boxWidth: 12 }
                    }
                },
                cutout: "68%"
            }
        });
    };

    // Renderizado general de lista y KPIs
    const renderizarGastos = () => {
        listaGastos.innerHTML = "";
        
        const misMovimientos = window.AppDB.query(
            `SELECT * FROM gastos WHERE id_usuario = ? AND estado_activo = 1 ORDER BY fecha_gasto DESC`,
            [currentUserId]
        );
        
        let totalIngresos = 0;
        let totalEgresos = 0;

        if (misMovimientos.length === 0) {
            listaGastos.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 30px;">Sin movimientos registrados.</p>`;
            totalIngresosEl.textContent = `$0.00`;
            totalEgresosEl.textContent = `$0.00`;
            balanceTotalEl.textContent = `$0.00`;
            actualizarGraficoSemanal([]);
            actualizarGraficoMensual([]);
            return;
        }

        const fragment = document.createDocumentFragment();
        misMovimientos.forEach(mov => {
            const esIngreso = mov.tipo === "Ingreso";
            if (esIngreso) totalIngresos += mov.monto;
            else totalEgresos += mov.monto;

            const item = document.createElement("div");
            item.className = `gasto-card-item ${esIngreso ? 'ingreso-item' : 'egreso-item'}`;
            item.innerHTML = `
                <div>
                    <strong style="font-size: 0.95rem; color: var(--text-primary);">${mov.descripcion}</strong>
                    <span class="badge-tipo ${esIngreso ? 'ingreso' : 'egreso'}">${mov.tipo}</span>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                        <span>${mov.categoria}</span> • <span>${mov.fecha_gasto}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; font-size: 1.05rem; color: ${esIngreso ? 'var(--green-accent)' : 'var(--text-primary)'};">
                        ${esIngreso ? '+' : '-'}$${mov.monto.toFixed(2)}
                    </span>
                    <div class="gasto-actions">
                        <button class="btn-icon btn-edit" data-id="${mov.id_gasto}" aria-label="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete btn-delete" data-id="${mov.id_gasto}" aria-label="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
            fragment.appendChild(item);
        });

        listaGastos.appendChild(fragment);

        const balance = totalIngresos - totalEgresos;
        totalIngresosEl.textContent = `$${totalIngresos.toFixed(2)}`;
        totalEgresosEl.textContent = `$${totalEgresos.toFixed(2)}`;
        balanceTotalEl.textContent = `$${balance.toFixed(2)}`;
        balanceTotalEl.style.color = balance < 0 ? "var(--rose-danger)" : "var(--blue-accent)";

        actualizarGraficoSemanal(misMovimientos);
        actualizarGraficoMensual(misMovimientos);
    };

    // Guardar / Editar movimiento
    formGastos.addEventListener("submit", (e) => {
        e.preventDefault();
        const idGasto = document.getElementById("gasto-id").value;
        const tipo = tipoSelect.value;
        const desc = document.getElementById("gasto-desc").value.trim();
        const monto = parseFloat(document.getElementById("gasto-monto").value);
        const cat = catSelect.value;
        const fecha = document.getElementById("gasto-fecha").value;

        if (monto <= 0 || isNaN(monto)) return;

        if (idGasto) {
            window.AppDB.db.run(
                `UPDATE gastos SET tipo = ?, descripcion = ?, monto = ?, categoria = ?, fecha_gasto = ? WHERE id_gasto = ? AND id_usuario = ?`,
                [tipo, desc, monto, cat, fecha, idGasto, currentUserId]
            );
        } else {
            window.AppDB.db.run(
                `INSERT INTO gastos (id_usuario, tipo, descripcion, monto, categoria, fecha_gasto) VALUES (?, ?, ?, ?, ?, ?)`,
                [currentUserId, tipo, desc, monto, cat, fecha]
            );
        }
        
        window.AppDB.save();
        renderizarGastos();
        salirModoEdicion();
    });

    // Editar / Soft Delete
    listaGastos.addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-edit");
        const btnDel = e.target.closest(".btn-delete");

        if (btnEdit) {
            const gastoId = btnEdit.dataset.id;
            const res = window.AppDB.query(`SELECT * FROM gastos WHERE id_gasto = ?`, [gastoId]);
            if (res.length > 0) {
                const g = res[0];
                document.getElementById("gasto-id").value = g.id_gasto;
                tipoSelect.value = g.tipo || "Egreso";
                actualizarCategoriasSelect();
                document.getElementById("gasto-desc").value = g.descripcion;
                document.getElementById("gasto-monto").value = g.monto;
                catSelect.value = g.categoria;
                document.getElementById("gasto-fecha").value = g.fecha_gasto;
                document.getElementById("form-title").textContent = "Editar Movimiento";
                document.getElementById("btn-cancel-edit").classList.remove("hidden");
            }
        }

        if (btnDel) {
            if(confirm("¿Inactivar este registro del historial?")) {
                window.AppDB.db.run(`UPDATE gastos SET estado_activo = 0 WHERE id_gasto = ? AND id_usuario = ?`, [btnDel.dataset.id, currentUserId]);
                window.AppDB.save();
                renderizarGastos();
            }
        }
    });

    const salirModoEdicion = () => {
        document.getElementById("gasto-id").value = "";
        document.getElementById("form-title").textContent = "Registrar Movimiento";
        document.getElementById("btn-cancel-edit").classList.add("hidden");
        formGastos.reset();
        actualizarCategoriasSelect();
        document.getElementById("gasto-fecha").valueAsDate = new Date();
    };

    document.getElementById("btn-cancel-edit").addEventListener("click", salirModoEdicion);

    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("usuario_activo_id");
        localStorage.removeItem("usuario_activo_nombre");
        window.location.href = "./login.html";
    });

    renderizarGastos();
});
