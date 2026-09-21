document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Verificación de Seguridad y Sesión (Regla de Negocio 2.a) ---
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario_logueado'));

    if (!usuarioLogueado || !usuarioLogueado.email) {
        window.location.href = 'index.html';
        return;
    }

    // --- Referencias DOM ---
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
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

    // Elementos del Modal Accesible
    const deleteModal = document.getElementById('delete-modal');
    const modalContainer = document.getElementById('modal-container');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let idGastoAEliminar = null;
    let ultimoElementoFocado = null;

    userDisplay.textContent = usuarioLogueado.nombre || usuarioLogueado.email;

    // --- 2. Persistencia Visual / Modo Día-Noche (WCAG) ---
    const applySavedTheme = () => {
        const theme = localStorage.getItem('sgg_theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️ Modo Día';
            themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo día');
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙 Modo Noche';
            themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo noche');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('sgg_theme', isDark ? 'dark' : 'light');
        themeToggleBtn.textContent = isDark ? '☀️ Modo Día' : '🌙 Modo Noche';
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche');
    });

    applySavedTheme();

    // --- 3. Control del LocalStorage (gastos_sgg) ---
    const obtenerTodosLosGastos = () => JSON.parse(localStorage.getItem('gastos_sgg')) || [];
    const guardarTodosLosGastos = (gastos) => localStorage.setItem('gastos_sgg', JSON.stringify(gastos));

    // --- 4. Renderizado Dinámico y Seguro (RF-06, RF-09) ---
    const renderizarDashboard = () => {
        const todosLosGastos = obtenerTodosLosGastos();

        // Trazabilidad y Baja Lógica: filtro estricto por usuario y estado activo
        const gastosUsuario = todosLosGastos.filter(gasto => 
            gasto.email_usuario === usuarioLogueado.email && gasto.estado_activo === true
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
                const tdCategoria = document.createElement('td');
                const badge = document.createElement('span');
                badge.className = 'badge badge-category';
                badge.textContent = gasto.categoria;
                tdCategoria.appendChild(badge);
                tr.appendChild(tdCategoria);

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
                btnEdit.setAttribute('aria-label', `Editar gasto del ${formatearFecha(gasto.fecha)} por $${gasto.monto}`);
                btnEdit.addEventListener('click', () => prepararEdicion(gasto.id));

                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn btn-delete';
                btnDelete.type = 'button';
                btnDelete.textContent = 'Eliminar';
                btnDelete.setAttribute('aria-label', `Eliminar gasto del ${formatearFecha(gasto.fecha)} por $${gasto.monto}`);
                btnDelete.addEventListener('click', (e) => abrirModalEliminar(gasto.id, e.currentTarget));

                tdAcciones.appendChild(btnEdit);
                tdAcciones.appendChild(btnDelete);
                tr.appendChild(tdAcciones);

                gastosTbody.appendChild(tr);
            });
        }

        // RF-09: Cálculo del Total Dinámico
        const totalCalculado = gastosUsuario.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
        totalMontoDisplay.textContent = `$${totalCalculado.toFixed(2)}`;
    };

    // --- 5. Validaciones y Formulario ---
    const limpiarErrores = () => {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('input, select').forEach(el => el.setAttribute('aria-invalid', 'false'));
    };

    const marcarError = (inputEl, errorElId, mensaje) => {
        const errorEl = document.getElementById(errorElId);
        if (errorEl) errorEl.textContent = mensaje;
        if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
    };

    const validarFormulario = () => {
        limpiarErrores();
        let esValido = true;

        const montoVal = parseFloat(montoInput.value);
        if (isNaN(montoVal) || montoVal <= 0) {
            marcarError(montoInput, 'error-monto', 'El monto debe ser un número mayor a cero.');
            esValido = false;
        }

        if (!fechaInput.value) {
            marcarError(fechaInput, 'error-fecha', 'Ingrese una fecha válida.');
            esValido = false;
        }

        if (!categoriaSelect.value) {
            marcarError(categoriaSelect, 'error-categoria', 'Seleccione una categoría.');
            esValido = false;
        }

        if (!descripcionInput.value.trim()) {
            marcarError(descripcionInput, 'error-descripcion', 'Ingrese una descripción.');
            esValido = false;
        }

        return esValido;
    };

    gastoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        const todosLosGastos = obtenerTodosLosGastos();
        const idEditando = gastoIdInput.value;

        if (idEditando) {
            const index = todosLosGastos.findIndex(g => g.id === idEditando);
            if (index !== -1) {
                todosLosGastos[index].monto = parseFloat(montoInput.value);
                todosLosGastos[index].fecha = fechaInput.value;
                todosLosGastos[index].categoria = categoriaSelect.value;
                todosLosGastos[index].descripcion = descripcionInput.value.trim();
            }
        } else {
            const nuevoGasto = {
                id: 'gasto_' + Date.now(),
                email_usuario: usuarioLogueado.email,
                monto: parseFloat(montoInput.value),
                fecha: fechaInput.value,
                categoria: categoriaSelect.value,
                descripcion: descripcionInput.value.trim(),
                estado_activo: true
            };
            todosLosGastos.push(nuevoGasto);
        }

        guardarTodosLosGastos(todosLosGastos);
        resetearFormulario();
        renderizarDashboard();
    });

    const prepararEdicion = (id) => {
        const todosLosGastos = obtenerTodosLosGastos();
        const gasto = todosLosGastos.find(g => g.id === id);

        if (gasto) {
            gastoIdInput.value = gasto.id;
            montoInput.value = gasto.monto;
            fechaInput.value = gasto.fecha;
            categoriaSelect.value = gasto.categoria;
            descripcionInput.value = gasto.descripcion;

            submitBtn.textContent = 'Actualizar Gasto';
            cancelBtn.classList.remove('hidden');
            montoInput.focus();
        }
    };

    const resetearFormulario = () => {
        gastoForm.reset();
        gastoIdInput.value = '';
        submitBtn.textContent = 'Guardar Gasto';
        cancelBtn.classList.add('hidden');
        limpiarErrores();
    };

    cancelBtn.addEventListener('click', resetearFormulario);

    // --- 6. Baja Lógica Accesible (RF-08 & WCAG Dialog Standard) ---
    const abrirModalEliminar = (id, triggerElement) => {
        idGastoAEliminar = id;
        ultimoElementoFocado = triggerElement;
        
        deleteModal.classList.remove('hidden');
        deleteModal.removeAttribute('aria-hidden');
        cancelDeleteBtn.focus();

        document.addEventListener('keydown', atrapadoDeFocoModal);
    };

    const cerrarModalEliminar = () => {
        idGastoAEliminar = null;
        deleteModal.classList.add('hidden');
        deleteModal.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', atrapadoDeFocoModal);

        if (ultimoElementoFocado) {
            ultimoElementoFocado.focus();
        }
    };

    const atrapadoDeFocoModal = (e) => {
        if (e.key === 'Escape') {
            cerrarModalEliminar();
            return;
        }

        if (e.key === 'Tab') {
            const elementosFocables = [confirmDeleteBtn, cancelDeleteBtn];
            const primerElemento = elementosFocables[0];
            const ultimoElemento = elementosFocables[elementosFocables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === primerElemento) {
                    ultimoElemento.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === ultimoElemento) {
                    primerElemento.focus();
                    e.preventDefault();
                }
            }
        }
    };

    cancelDeleteBtn.addEventListener('click', cerrarModalEliminar);

    confirmDeleteBtn.addEventListener('click', () => {
        if (!idGastoAEliminar) return;

        const todosLosGastos = obtenerTodosLosGastos();
        const gasto = todosLosGastos.find(g => g.id === idGastoAEliminar);
        
        if (gasto) {
            gasto.estado_activo = false; // Sin splice, cambio de estado estricto
            guardarTodosLosGastos(todosLosGastos);
        }

        cerrarModalEliminar();
        renderizarDashboard();
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario_logueado');
        window.location.href = 'index.html';
    });

    // --- Utilidades ---
    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const [anio, mes, dia] = fechaStr.split('-');
        return `${dia}/${mes}/${anio}`;
    };

    renderizarDashboard();
});