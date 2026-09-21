document.addEventListener('DOMContentLoaded', () => {
    // Seguridad de Rutas (2.a)
    const usuarioLogueado = SGG.obtenerSesion();
    if (!usuarioLogueado || !usuarioLogueado.email) {
        window.location.href = 'login.html';
        return;
    }

    // Referencias DOM
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const gastoForm = document.getElementById('gasto-form');
    const gastoIdInput = document.getElementById('gasto-id');
    const montoInput = document.getElementById('monto');
    const fechaInput = document.getElementById('fecha');
    const categoriaSelect = document.getElementById('categoria');
    const descripcionInput = document.getElementById('descripcion');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const gastosTbody = document.getElementById('gastos-tbody');
    const totalMontoDisplay = document.getElementById('total-monto');
    const emptyMessage = document.getElementById('empty-message');

    // Modal
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let idGastoAEliminar = null;

    userDisplay.textContent = usuarioLogueado.nombre || usuarioLogueado.email;

    const obtenerGastos = () => JSON.parse(localStorage.getItem('gastos_sgg')) || [];
    const guardarGastos = (gastos) => localStorage.setItem('gastos_sgg', JSON.stringify(gastos));

    const renderizarDashboard = () => {
        const todosLosGastos = obtenerGastos();
        
        // Trazabilidad por usuario activo y baja lógica (estado_activo: true)
        const gastosUsuario = todosLosGastos.filter(g => 
            g.email_usuario === usuarioLogueado.email && g.estado_activo === true
        );

        gastosTbody.innerHTML = '';
        if (gastosUsuario.length === 0) {
            emptyMessage.classList.remove('hidden');
        } else {
            emptyMessage.classList.add('hidden');
            gastosUsuario.forEach(gasto => {
                const tr = document.createElement('tr');

                // Fecha
                const tdFecha = document.createElement('td');
                tdFecha.textContent = formatearFecha(gasto.fecha);
                tr.appendChild(tdFecha);

                // Categoría
                const tdCat = document.createElement('td');
                const badge = document.createElement('span');
                badge.className = 'badge badge-category';
                badge.textContent = gasto.categoria;
                tdCat.appendChild(badge);
                tr.appendChild(tdCat);

                // Descripción
                const tdDesc = document.createElement('td');
                tdDesc.textContent = gasto.descripcion;
                tr.appendChild(tdDesc);

                // Monto
                const tdMonto = document.createElement('td');
                tdMonto.className = 'amount-cell';
                tdMonto.textContent = `$${parseFloat(gasto.monto).toFixed(2)}`;
                tr.appendChild(tdMonto);

                // Acciones
                const tdAcciones = document.createElement('td');
                
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-edit';
                btnEdit.type = 'button';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => prepararEdicion(gasto.id));

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn btn-delete';
                btnDelete.type = 'button';
                btnDelete.textContent = 'Eliminar';
                btnDelete.addEventListener('click', () => abrirModalEliminar(gasto.id));

                tdAcciones.appendChild(btnEdit);
                tdAcciones.appendChild(btnDelete);
                tr.appendChild(tdAcciones);

                gastosTbody.appendChild(tr);
            });
        }

        // RF-09: Total Dinámico
        const total = gastosUsuario.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
        totalMontoDisplay.textContent = `$${total.toFixed(2)}`;
    };

    const validarFormulario = () => {
        SGG.limpiarErrores();
        let esValido = true;

        const montoVal = parseFloat(montoInput.value);
        if (isNaN(montoVal) || montoVal <= 0) {
            SGG.marcarError(montoInput, 'error-monto', 'El monto debe ser superior a cero.');
            esValido = false;
        }

        if (!fechaInput.value) {
            SGG.marcarError(fechaInput, 'error-fecha', 'Seleccione una fecha.');
            esValido = false;
        }

        if (!categoriaSelect.value) {
            SGG.marcarError(categoriaSelect, 'error-categoria', 'Seleccione una categoría.');
            esValido = false;
        }

        if (!descripcionInput.value.trim()) {
            SGG.marcarError(descripcionInput, 'error-descripcion', 'Ingrese una descripción.');
            esValido = false;
        }

        return esValido;
    };

    gastoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        const todosLosGastos = obtenerGastos();
        const idEditando = gastoIdInput.value;

        if (idEditando) {
            const idx = todosLosGastos.findIndex(g => g.id === idEditando);
            if (idx !== -1) {
                todosLosGastos[idx].monto = parseFloat(montoInput.value);
                todosLosGastos[idx].fecha = fechaInput.value;
                todosLosGastos[idx].categoria = categoriaSelect.value;
                todosLosGastos[idx].descripcion = descripcionInput.value.trim();
            }
        } else {
            todosLosGastos.push({
                id: 'gasto_' + Date.now(),
                email_usuario: usuarioLogueado.email,
                monto: parseFloat(montoInput.value),
                fecha: fechaInput.value,
                categoria: categoriaSelect.value,
                descripcion: descripcionInput.value.trim(),
                estado_activo: true
            });
        }

        guardarGastos(todosLosGastos);
        resetearFormulario();
        renderizarDashboard();
    });

    const prepararEdicion = (id) => {
        const todosLosGastos = obtenerGastos();
        const gasto = todosLosGastos.find(g => g.id === id);

        if (gasto) {
            gastoIdInput.value = gasto.id;
            montoInput.value = gasto.monto;
            fechaInput.value = gasto.fecha;
            categoriaSelect.value = gasto.categoria;
            descripcionInput.value = gasto.descripcion;

            submitBtn.textContent = 'Actualizar Gasto';
            cancelBtn.classList.remove('hidden');
        }
    };

    const resetearFormulario = () => {
        gastoForm.reset();
        gastoIdInput.value = '';
        submitBtn.textContent = 'Guardar Gasto';
        cancelBtn.classList.add('hidden');
        SGG.limpiarErrores();
    };

    cancelBtn.addEventListener('click', resetearFormulario);

    // Baja Lógica Sin .splice()
    const abrirModalEliminar = (id) => {
        idGastoAEliminar = id;
        deleteModal.classList.remove('hidden');
        deleteModal.removeAttribute('aria-hidden');
    };

    const cerrarModalEliminar = () => {
        idGastoAEliminar = null;
        deleteModal.classList.add('hidden');
        deleteModal.setAttribute('aria-hidden', 'true');
    };

    cancelDeleteBtn.addEventListener('click', cerrarModalEliminar);

    confirmDeleteBtn.addEventListener('click', () => {
        if (!idGastoAEliminar) return;

        const todosLosGastos = obtenerGastos();
        const gasto = todosLosGastos.find(g => g.id === idGastoAEliminar);

        if (gasto) {
            gasto.estado_activo = false; // Modificación directa de la propiedad
            guardarGastos(todosLosGastos);
        }

        cerrarModalEliminar();
        renderizarDashboard();
    });

    logoutBtn.addEventListener('click', SGG.cerrarSesion);

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const [anio, mes, dia] = fechaStr.split('-');
        return `${dia}/${mes}/${anio}`;
    };

    renderizarDashboard();
});
