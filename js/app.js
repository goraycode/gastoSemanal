//Variables y selectores
const formulario = document.querySelector('#agregar-gasto');
const gastoLista = document.querySelector('#gastos ul');

const buttonPresupuesto = document.querySelector('#buttonPresupuesto');
const button = document.querySelector('#button');



let presupuesto;



//Eventos
eventListeners();
function eventListeners() {

    document.addEventListener('DOMContentLoaded', reloadStorage);

    formulario.addEventListener('submit', validarGastos);
    buttonPresupuesto.addEventListener('click', preguntarPresupuesto);
}


//Clases
class Presupuesto {

    constructor(presupuesto) {
        this.presupuesto = Number(presupuesto);
        this.restante = Number(presupuesto);
        this.gasto = JSON.parse(localStorage.getItem('compras')) || [];
    }

    nuevoGasto(gasto) {
        
        this.gasto = [...this.gasto, gasto];
        this.calcularRestante();
    }

    calcularRestante() {
        //sumamos la cantidad hasta el momento
        let totalCantidad = this.gasto.reduce((total, gasto) => total + gasto.cantidad, 0);

        if (totalCantidad > this.presupuesto) {


            ui.presupuestoAgotado('Excede el presupuesto');
            this.gasto.pop(); //eliminamos el último elemento si esque pasa del presupuesto
        } else {
            this.restante = this.presupuesto - totalCantidad;
        }


    }

    eliminarGasto(id) {
        this.gasto = this.gasto.filter(gastoUnico => gastoUnico.id !== id);

        //cada vez que eliminamos, calculamos el restante
        this.calcularRestante();
    }



}


class UI {

    insertarPresupuesto(cantidad) {
        //extrayendo los valores
        const { presupuesto, restante } = cantidad;
        //agregamos al HTML
        document.querySelector('#total').textContent = presupuesto;
        document.querySelector('#restante').textContent = restante;
    }
    mensaje(mensaje, tipo) {
        const divMensaje = document.createElement('div');
        divMensaje.classList.add('mensaje');

        if (tipo === 'error') {
            divMensaje.classList.add('bg-danger');
        } else {
            divMensaje.classList.add('bg-success');
        }

        const verMensaje = document.querySelector('.mensaje');
        const pMensaje = document.createElement('p');
        pMensaje.classList.add('text-center', 'text-light', 'p-2')
        pMensaje.textContent = mensaje;

        if (verMensaje !== null) {
            verMensaje.remove();
        }

        divMensaje.appendChild(pMensaje);

        formulario.insertBefore(divMensaje, button);
        setTimeout(() => {
            divMensaje.remove();
        }, 3000);
    }


    mostrarGasto(gastos) {

        this.limpiarHTML();
        gastos.forEach(gasto => {
            const { cantidad, gastoNombre, id } = gasto;

            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center mt-3 p-2 bg-info';
            li.setAttribute('data-id', id);


            li.innerHTML = `
            Gasto: ${gastoNombre}
            <span class="badge badge-primary badge-pill">Cantidad: $${cantidad}</span>
            `;

            const btnBorrar = document.createElement('button');
            btnBorrar.classList.add('btn', 'btn-danger', 'borrar-gasto');
            btnBorrar.textContent = '❌';

            //para cuando le de click el usuario en borrar este se pueda borrar
            btnBorrar.onclick = () => {
                eliminarGasto(id);
            }

            li.appendChild(btnBorrar);

            gastoLista.appendChild(li);
        });

        //agregamos los gastos al localStorage
        sincronizarStorage(gastos);

    }

    actualizarRestante(restante) {

        const presupuesto = Number(document.querySelector('#total').textContent);

        let restaPintar = document.querySelector('#restante');
        restaPintar.textContent = restante;


        if (Number(restaPintar.textContent) <= presupuesto * 0.20) {
            restaPintar.parentElement.parentElement.className = "alert alert-danger";
        } else if (Number(restaPintar.textContent) <= presupuesto * 0.50) {
            restaPintar.parentElement.parentElement.className = "alert alert-warning";

            //si se quitan los elementos de la lista
        } else {
            restaPintar.parentElement.parentElement.classList.remove('alert-danger', 'alert-warning');
            restaPintar.parentElement.parentElement.className = "alert alert-success";
        }

        if (Number(restaPintar.textContent) <= 0) {
            button.disabled = true;
            button.style.opacity = "0.2";
            button.style.cursor = "not-allowed";
        }

        //localStorage
        sincronizarStoragePresupuesto(presupuesto, Number(restaPintar.textContent));

    }

    mostrarButton() {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
    }

    presupuestoAgotado(mensaje) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: mensaje,
        })
    }

    limpiarHTML() {
        while (gastoLista.firstChild) {
            gastoLista.removeChild(gastoLista.firstChild);
        }
    }

    resetFormulario() {
        formulario.reset();
    }

}

//instanciamos la clase UI para impirmir los HTML
const ui = new UI();


//Funciones

function reloadStorage() {

    const presupuestoS = JSON.parse(localStorage.getItem('presupuesto'));

    presupuesto = new Presupuesto(presupuestoS);

    const { gasto } = presupuesto;


    const presupuestoDiv = document.querySelector('#total');
    presupuestoDiv.textContent = Number(localStorage.getItem('presupuesto'));

    const restanteDiv = document.querySelector('#restante');
    restanteDiv.textContent = Number(localStorage.getItem('restante'));

    if (restanteDiv.textContent > 0) {

        ui.actualizarRestante(restanteDiv.textContent);
        ui.mostrarButton();
    } else {

        button.disabled = true;
        button.style.opacity = "0.2";
        button.style.cursor = "not-allowed";
    }

    ui.mostrarGasto(gasto);




}


function preguntarPresupuesto() {

    localStorage.clear();

    Swal.fire({
        title: 'Ingresa tu presupuesto',
        input: 'text',
        inputPlaceholder: '500',
    });

    const budgetContainer = document.querySelector('.swal2-container');
    const budgetInput = document.querySelector('.swal2-input');

    budgetContainer.addEventListener('click', (e) => {
        const budgetValue = Number(budgetInput.value);

        if (e.target.classList.contains('swal2-container') || e.target.classList.contains('swal2-confirm')) {
            if (budgetValue === '' || budgetValue <= 0 || isNaN(budgetValue)) {
                window.location.reload();
            } else {

                ui.limpiarHTML();

                presupuesto = new Presupuesto(budgetValue);

                ui.mostrarButton();

                ui.insertarPresupuesto(presupuesto);
            }
        }
        if (e.target.classList.contains('swal2-popup')) {
            return;
        }
    });

}


function validarGastos(e) {

    e.preventDefault();


    const gastoNombre = document.querySelector('#gasto').value;
    const cantidad = Number(document.querySelector('#cantidad').value);

    if (gastoNombre !== '' && cantidad != '') {
        if (isNaN(cantidad) === false && cantidad > 0) {
            //agregamos los valores al campo
            const gastoAgregado = { gastoNombre, cantidad, id: Date.now() }


            presupuesto.nuevoGasto(gastoAgregado);

            ui.mensaje('Correcto', 'success');


            const { gasto, restante } = presupuesto;

            ui.mostrarGasto(gasto);

            ui.actualizarRestante(restante);



            ui.resetFormulario();


        } else {
            ui.mensaje('Cantidad no válida, ingrese un número', 'error');
        }


    } else {
        ui.mensaje('Todos los campos son necesarios', 'error');
    }

}


function eliminarGasto(id) {
    presupuesto.eliminarGasto(id);
    const { gasto, restante } = presupuesto;
    ui.mostrarGasto(gasto);


    if (restante > 0) {
        ui.mostrarButton();
    }

    ui.actualizarRestante(restante);


}


function sincronizarStorage(gastos) {
    localStorage.setItem('compras', JSON.stringify(gastos));
}

function sincronizarStoragePresupuesto(presupuestoS, restanteS) {
    localStorage.setItem('presupuesto', presupuestoS);
    localStorage.setItem('restante', restanteS);
}