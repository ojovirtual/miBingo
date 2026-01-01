let wakeLock = null;
const requestWakeLock = async () => {
	if (!('wakeLock' in navigator)) {
		console.log("'wakeLock' no disponible en este navegador");
		return;
	}
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		wakeLock.addEventListener('release', () => {
			console.log('Screen Wake Lock was released');
		});
		console.log('Screen Wake Lock is active');
	} catch (err) {
		console.error(`${err.name}, ${err.message}`);
	}
};

//definir globales
window.CONFIG = { segundos: 8, pausa: true };

window.onload = function () {
	inicializa();
	configurarModalVelocidad();
};

function configurarModalVelocidad() {
	// Obtener el modal de velocidad
	const modalVelocidad = document.getElementById('modalVelocidad');

	// Guardar el estado de pausa antes de abrir el modal
	let pausaAnterior = false;

	modalVelocidad.addEventListener('show.bs.modal', function () {
		// Guardar el estado actual de pausa
		pausaAnterior = window.CONFIG.pausa;

		// Si no está pausado, pausarlo
		if (!window.CONFIG.pausa) {
			pausa();
		}
	});

	modalVelocidad.addEventListener('hidden.bs.modal', function () {
		// Si estaba en ejecución antes de abrir el modal, continuar
		if (!pausaAnterior) {
			pausa();
		}
	});
}

function inicializa() {
	const aux = new Array(91);
	const numeros = [...aux.keys()];
	numeros.shift();
	window.NUMEROS = numeros;
	window.PREMIADOS = [];
	// pintar la tabla
	let tabla = document.querySelector('table[name=tabla-numeros] tbody');
	tabla.innerHTML = '';
	let tr = '<tr>';
	for (let i = 1; i <= 90; i++) {
		tr += `<td numero='${i}'>${i}</td>`;
		if (i % 10 == 0) {
			tabla.innerHTML += tr + '</tr>';
			tr = '<tr>';
		}
	}
	tr += '</tr>';
	tabla.innerHTML += tr;
	document.querySelector('#rangeVelocidad').value = window.CONFIG.segundos;
}

function sacaNumero() {
	//sacar un numero y devolver
	if (window.NUMEROS.length == 0) {
		return false;
	}
	const min = 0;
	const max = window.NUMEROS.length - 1;
	const elegido = Math.floor(Math.random() * (max + 1 - min)) + min;
	const vuelta = window.NUMEROS[elegido];
	//quitar el elegido del array
	window.NUMEROS = [...window.NUMEROS.slice(0, elegido), ...window.NUMEROS.slice(elegido + 1)];
	window.PREMIADOS = vuelta;
	return vuelta;
}

function generarTextoAudio(numero) {
	// Para números del 60 al 79, decir el número completo y luego las dos cifras
	if (numero >= 60 && numero <= 79) {
		const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
		const decenas = {
			60: 'sesenta',
			61: 'sesenta y uno',
			62: 'sesenta y dos',
			63: 'sesenta y tres',
			64: 'sesenta y cuatro',
			65: 'sesenta y cinco',
			66: 'sesenta y seis',
			67: 'sesenta y siete',
			68: 'sesenta y ocho',
			69: 'sesenta y nueve',
			70: 'setenta',
			71: 'setenta y uno',
			72: 'setenta y dos',
			73: 'setenta y tres',
			74: 'setenta y cuatro',
			75: 'setenta y cinco',
			76: 'setenta y seis',
			77: 'setenta y siete',
			78: 'setenta y ocho',
			79: 'setenta y nueve'
		};

		const decena = Math.floor(numero / 10);
		const unidad = numero % 10;

		return `${decenas[numero]}, ${unidades[decena]}, ${unidades[unidad]}`;
	}

	// Para otros números, solo el número
	return String(numero);
}

function comienza() {
	if (window.NUMEROS === undefined) inicializa();
	window.miTimeOut = setTimeout(function () {
		if (window.CONFIG.pausa) return;
		let numero = sacaNumero();
		if (numero === false) {
			console.log('Fin!');
			return;
		}
		console.log(numero);
		document.querySelector('[name=numero]').innerHTML = numero;

		// Quitar la clase 'ultimo-numero' del número anterior
		const ultimoAnterior = document.querySelector('table tbody td.ultimo-numero');
		if (ultimoAnterior) {
			ultimoAnterior.classList.remove('ultimo-numero');
		}

		// Marcar el nuevo número con las clases correspondientes
		const celdaNueva = document.querySelector(`table tbody td[numero='${numero}']`);
		celdaNueva.classList.add('bg-danger', 'text-white', 'ultimo-numero');

		let speech = new SpeechSynthesisUtterance();
		speech.text = generarTextoAudio(numero);
		window.speechSynthesis.speak(speech);
		comienza();
	}, window.CONFIG.segundos * 1000);
}

function pausa() {
	window.CONFIG.pausa = !window.CONFIG.pausa;
	if (!window.CONFIG.pausa) {
		comienza();
	}
	document.querySelector('button[name=btnPausa]').innerHTML = window.CONFIG.pausa
		? `<i class="bi bi-play-circle"></i> SIGUE`
		: `<i class="bi bi-pause-fill"></i> PAUSA`;
}

function cambiaVelocidad() {
	let velocidad = document.querySelector('#rangeVelocidad').value;
	window.CONFIG.segundos = velocidad;
	document.querySelector('#valorVelocidad').textContent = velocidad;
}

function reiniciar() {
	/*	window.CONFIG.pausa = false;
	document.querySelector('[name=numero]').innerHTML = '';
	clearTimeout(window.miTimeOut);
	inicializa();*/
	window.location.reload(true);
}
