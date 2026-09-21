"use strict";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seguridad de Rutas
    const usuarioLogueado = SGG.obtenerSesion();
    if (!usuarioLogueado) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Referencias DOM
    document.getElementById('user-display').textContent = usuarioLogueado.nombre;
    const logoutBtn = document.getElementById('logout-btn');
    const form = document.getElementById('gasto-form');
    const tbody = document.getElementById('gastos-tbody');
    const emptyMsg = document.getElementById('empty-message');
    const totalDisplay = document.getElementById('total-monto');
    const deleteModal = document.getElementById('delete-modal');
    
    let idEliminar = null;

    // 3. Funciones CRUD Base
    const getGastos = () => JSON.parse(localStorage.getItem('gastos_sgg')) || [];
    const saveGastos = (g) => localStorage.setItem('gastos_sgg', JSON.stringify(g));
    const formatearFecha = (f) => f.split('-').reverse().join('/');

    const renderizar = () => {
        const todos = getGastos();
        const misGastos = todos.filter(g => g.email === usuarioLogueado.email && g.activo);

        tbody.innerHTML = '';
        if (misGastos.length === 0) {
            emptyMsg.style.display = 'block';
        } else {
            emptyMsg.style.display = 'none';
            misGastos.forEach(g => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatearFecha(g.fecha)}</td>
                    <td><span class="badge">${g.categoria}</span></td>
                    <td>${g.descripcion}</td>
                    <td style="font-weight: bold;">$${parseFloat(g.monto).toFixed(2)}</td>
                    <td>
                        <button class="btn-action edit" onclick="editarGasto('${g.id}')" aria-label="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete" onclick="abrirModalEliminar('${g.id}')" aria-label="Eliminar"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        const total = misGastos.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
        totalDisplay.textContent = `$${total.toFixed(2)}`;
    };

    // 4. Procesamiento del Formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        SGG.limpiarErrores();
        
        const monto = parseFloat(document.getElementById('monto').value);
        const fecha = document.getElementById('fecha').value;
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const idEdit = document.getElementById('gasto-id').value;
        let valido = true;

        if(isNaN(monto) || monto <= 0) { SGG.mostrarError('error-monto', 'Monto inválido'); valido = false; }
        if(!fecha) { SGG.mostrarError('error-fecha', 'Requerido'); valido = false; }
        if(!categoria) { SGG.mostrarError('error-categoria', 'Requerido'); valido = false; }
        if(!descripcion) { SGG.mostrarError('error-descripcion', 'Requerido'); valido = false; }

        if(!valido) return;

        const todos = getGastos();
        if (idEdit) {
            const idx = todos.findIndex(g => g.id === idEdit);
            if (idx !== -1) {
                todos[idx] = { ...todos[idx], monto, fecha, categoria, descripcion };
            }
        } else {
            todos.push({ id: Date.now().toString(), email: usuarioLogueado.email, monto, fecha, categoria, descripcion, activo: true });
        }

        saveGastos(todos);
        form.reset();
        document.getElementById('gasto-id').value = '';
        document.getElementById('cancel-btn').classList.add('hidden');
        renderizar();
    });

    // 5. Edición Global
    window.editarGasto = (id) => {
        const gasto = getGastos().find(g => g.id === id);
        if(gasto) {
            document.getElementById('gasto-id').value = gasto.id;
            document.getElementById('monto').value = gasto.monto;
            document.getElementById('fecha').value = gasto.fecha;
            document.getElementById('categoria').value = gasto.categoria;
            document.getElementById('descripcion').value = gasto.descripcion;
            document.getElementById('cancel-btn').classList.remove('hidden');
        }
    };

    document.getElementById('cancel-btn').addEventListener('click', () => {
        form.reset();
        document.getElementById('gasto-id').value = '';
        document.getElementById('cancel-btn').classList.add('hidden');
        SGG.limpiarErrores();
    });

    // 6. Modal y Baja Lógica
    window.abrirModalEliminar = (id) => {
        idEliminar = id;
        deleteModal.classList.remove('hidden');
    };

    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        idEliminar = null;
        deleteModal.classList.add('hidden');
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if(!idEliminar) return;
        const todos = getGastos();
        const gasto = todos.find(g => g.id === idEliminar);
        if(gasto) {
            gasto.activo = false;
            saveGastos(todos);
        }
        deleteModal.classList.add('hidden');
        renderizar();
    });

    logoutBtn.addEventListener('click', SGG.cerrarSesion);

    // Inicializar
    renderizar();
});
