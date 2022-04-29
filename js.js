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
};

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
		document.querySelector(`table tbody td[numero='${numero}']`).classList.add('bg-danger', 'text-white');
		let speech = new SpeechSynthesisUtterance();
		speech.text = String(numero);
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
}

function reiniciar() {
	/*	window.CONFIG.pausa = false;
	document.querySelector('[name=numero]').innerHTML = '';
	clearTimeout(window.miTimeOut);
	inicializa();*/
	window.location.reload(true);
}
