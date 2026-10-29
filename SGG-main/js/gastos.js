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

    let chartBarrasInstance = null;
    let chartDonaInstance = null;

    // Categorías según tipo
    const categoriasPorTipo = {
        egreso: ["Alimentación", "Transporte", "Servicios", "Entretenimiento", "Otros"],
        ingreso: ["Sueldo / Salario", "Freelance", "Inversiones", "Regalos", "Otros"]
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

    // --- CONSUMO ASINCRÓNICO DE API REST EXTERNA PARA IMÁGENES ---
    const subirComprobanteAPI = async (fileInput) => {
        if (!fileInput.files || fileInput.files.length === 0) return null;

        const apiKey = "d3b45a0e9803bf5ff8137397b9ec59b5"; // Key pública/demostración
        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                return result.data.url; // URL pública entregada por la API
            }
            throw new Error("Respuesta no válida de la API de Imágenes");
        } catch (error) {
            console.warn("Resiliencia API: Error al subir imagen. Se registrará en NULL:", error);
            alert("No se pudo cargar la imagen en el servidor remoto. El movimiento se guardará sin comprobante.");
            return null; // Retorna NULL en caso de fallo garantizando resiliencia
        }
    };

    // --- GRÁFICO 1: COMPARATIVA DE BARRAS (SUM VIA GROUP BY SQL) ---
    const renderizarGraficoBarras = () => {
        const ctx = document.getElementById("chartBarras").getContext("2d");

        // Consulta de agregación SQL para métricas
        const res = window.AppDB.query(`
            SELECT tipo, SUM(monto) as total 
            FROM gastos 
            WHERE id_usuario = ? AND activo = 1 
            GROUP BY tipo
        `, [currentUserId]);

        let totalIngreso = 0;
        let totalEgreso = 0;

        res.forEach(row => {
            if (row.tipo === "ingreso") totalIngreso = row.total;
            if (row.tipo === "egreso") totalEgreso = row.total;
        });

        if (chartBarrasInstance) chartBarrasInstance.destroy();

        chartBarrasInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Ingresos", "Egresos"],
                datasets: [{
                    label: "Monto Acumulado ($)",
                    data: [totalIngreso, totalEgreso],
                    backgroundColor: ["#6b9080", "#d8708a"],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    };

    // --- GRÁFICO 2: DONA POR CATEGORÍAS DE EGRESO (SQL GROUP BY) ---
    const renderizarGraficoDona = () => {
        const ctx = document.getElementById("chartDona").getContext("2d");

        // Consulta agregada por categoría
        const res = window.AppDB.query(`
            SELECT categoria, SUM(monto) as total 
            FROM gastos 
            WHERE id_usuario = ? AND tipo = 'egreso' AND activo = 1 
            GROUP BY categoria
        `, [currentUserId]);

        const labels = res.map(r => r.categoria);
        const dataValues = res.map(r => r.total);

        if (chartDonaInstance) chartDonaInstance.destroy();

        if (labels.length === 0) return;

        chartDonaInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: ["#d8708a", "#6b9080", "#7ba4b5", "#e0a96d", "#9b829c"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                cutout: "65%"
            }
        });
    };

    // --- RENDERIZADO DE MOVIMIENTOS Y BALANCES ---
    const renderizarGastos = () => {
        listaGastos.innerHTML = "";
        
        // Obtener solo registros activos (Borrado Lógico)
        const misMovimientos = window.AppDB.query(
            `SELECT * FROM gastos WHERE id_usuario = ? AND activo = 1 ORDER BY fecha_gasto DESC`,
            [currentUserId]
        );
        
        let totalIngresos = 0;
        let totalEgresos = 0;

        if (misMovimientos.length === 0) {
            listaGastos.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 30px;">Sin movimientos activos.</p>`;
            totalIngresosEl.textContent = `$0.00`;
            totalEgresosEl.textContent = `$0.00`;
            balanceTotalEl.textContent = `$0.00`;
            renderizarGraficoBarras();
            renderizarGraficoDona();
            return;
        }

        const fragment = document.createDocumentFragment();
        misMovimientos.forEach(mov => {
            const esIngreso = mov.tipo === "ingreso";
            if (esIngreso) totalIngresos += mov.monto;
            else totalEgresos += mov.monto;

            const item = document.createElement("div");
            item.className = `gasto-card-item ${esIngreso ? 'ingreso-item' : 'egreso-item'}`;
            item.innerHTML = `
                <div>
                    <strong style="font-size: 0.95rem;">${mov.descripcion}</strong>
                    <span class="badge-tipo ${esIngreso ? 'ingreso' : 'egreso'}">${mov.tipo}</span>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                        <span>${mov.categoria}</span> • <span>${mov.fecha_gasto}</span>
                        ${mov.url_comprobante ? ` • <a href="${mov.url_comprobante}" target="_blank" style="color: var(--blue-accent);"><i class="fas fa-paperclip"></i> Comprobante</a>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; font-size: 1.05rem; color: ${esIngreso ? 'var(--green-accent)' : 'var(--text-primary)'};">
                        ${esIngreso ? '+' : '-'}$${mov.monto.toFixed(2)}
                    </span>
                    <div class="gasto-actions">
                        <button class="btn-icon btn-edit" data-id="${mov.id_gasto}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete btn-delete" data-id="${mov.id_gasto}"><i class="fas fa-trash-alt"></i></button>
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

        renderizarGraficoBarras();
        renderizarGraficoDona();
    };

    // --- REGISTRAR O EDITAR MOVIMIENTO ---
    formGastos.addEventListener("submit", async (e) => {
        e.preventDefault();
        const idGasto = document.getElementById("gasto-id").value;
        const tipo = tipoSelect.value;
        const desc = document.getElementById("gasto-desc").value.trim();
        const monto = parseFloat(document.getElementById("gasto-monto").value);
        const cat = catSelect.value;
        const fecha = document.getElementById("gasto-fecha").value;
        const fileInput = document.getElementById("gasto-comprobante");

        if (monto <= 0 || isNaN(monto)) return;

        // Cargar imagen mediante API externa si existe
        let urlComprobante = null;
        if (fileInput && fileInput.files.length > 0) {
            urlComprobante = await subirComprobanteAPI(fileInput);
        }

        if (idGasto) {
            window.AppDB.db.run(
                `UPDATE gastos SET tipo = ?, descripcion = ?, monto = ?, categoria = ?, fecha_gasto = ? ${urlComprobante ? ', url_comprobante = ?' : ''} WHERE id_gasto = ? AND id_usuario = ?`,
                urlComprobante ? [tipo, desc, monto, cat, fecha, urlComprobante, idGasto, currentUserId] : [tipo, desc, monto, cat, fecha, idGasto, currentUserId]
            );
        } else {
            window.AppDB.db.run(
                `INSERT INTO gastos (id_usuario, tipo, descripcion, monto, categoria, fecha_gasto, url_comprobante) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [currentUserId, tipo, desc, monto, cat, fecha, urlComprobante]
            );
        }
        
        await window.AppDB.save(); // Persistir en OPFS nativo
        renderizarGastos();
        salirModoEdicion();
    });

    // --- BORRADO LÓGICO (UPDATE activo = 0) ---
    listaGastos.addEventListener("click", async (e) => {
        const btnDel = e.target.closest(".btn-delete");
        const btnEdit = e.target.closest(".btn-edit");

        if (btnDel) {
            if (confirm("¿Deseas eliminar este registro del historial?")) {
                window.AppDB.db.run(`UPDATE gastos SET activo = 0 WHERE id_gasto = ? AND id_usuario = ?`, [btnDel.dataset.id, currentUserId]);
                await window.AppDB.save();
                renderizarGastos();
            }
        }

        if (btnEdit) {
            const res = window.AppDB.query(`SELECT * FROM gastos WHERE id_gasto = ?`, [btnEdit.dataset.id]);
            if (res.length > 0) {
                const g = res[0];
                document.getElementById("gasto-id").value = g.id_gasto;
                tipoSelect.value = g.tipo;
                actualizarCategoriasSelect();
                document.getElementById("gasto-desc").value = g.descripcion;
                document.getElementById("gasto-monto").value = g.monto;
                catSelect.value = g.categoria;
                document.getElementById("gasto-fecha").value = g.fecha_gasto;
                document.getElementById("form-title").textContent = "Editar Movimiento";
                document.getElementById("btn-cancel-edit").classList.remove("hidden");
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
