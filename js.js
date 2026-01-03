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
window.CONFIG = {
	segundos: 8,
	pausa: true,
	reproduciendoAudio: false,
	revisandoNumeros: false,
	progresoIniciado: 0,
	progresoIntervalo: null
};

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

		// Actualizar el estado de los botones según la velocidad actual
		const btnMasRapido = document.querySelector('#btnMasRapido');
		const btnMasLento = document.querySelector('#btnMasLento');

		if (btnMasRapido && btnMasLento) {
			btnMasRapido.disabled = (window.CONFIG.segundos <= 2);
			btnMasLento.disabled = (window.CONFIG.segundos >= 8);
		}
	});

	modalVelocidad.addEventListener('hidden.bs.modal', function () {
		// Si estaba en ejecución antes de abrir el modal, continuar
		if (!pausaAnterior) {
			pausa();
		}
	});
}

function guardarEstadoJuego() {
	const estado = {
		numeros: window.NUMEROS,
		premiados: window.PREMIADOS,
		velocidad: window.CONFIG.segundos
	};
	try {
		localStorage.setItem('miBingo_estadoJuego', JSON.stringify(estado));
	} catch (error) {
		console.error('Error al guardar el estado del juego:', error);
	}
}

function cargarEstadoJuego() {
	try {
		const estadoGuardado = localStorage.getItem('miBingo_estadoJuego');
		if (estadoGuardado) {
			return JSON.parse(estadoGuardado);
		}
	} catch (error) {
		console.error('Error al cargar el estado del juego:', error);
	}
	return null;
}

function limpiarEstadoJuego() {
	try {
		localStorage.removeItem('miBingo_estadoJuego');
	} catch (error) {
		console.error('Error al limpiar el estado del juego:', error);
	}
}

function inicializa() {
	// Intentar cargar el estado guardado
	const estadoGuardado = cargarEstadoJuego();

	if (estadoGuardado) {
		// Restaurar el estado del juego
		window.NUMEROS = estadoGuardado.numeros;
		window.PREMIADOS = estadoGuardado.premiados;
		if (estadoGuardado.velocidad !== undefined) {
			window.CONFIG.segundos = estadoGuardado.velocidad;
		}
	} else {
		// Inicializar nuevo juego
		const aux = new Array(91);
		const numeros = [...aux.keys()];
		numeros.shift();
		window.NUMEROS = numeros;
		window.PREMIADOS = [];
	}

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

	// Restaurar la visualización de los números premiados
	if (window.PREMIADOS.length > 0) {
		// Marcar todos los números premiados en la tabla
		window.PREMIADOS.forEach((numero, index) => {
			const celda = document.querySelector(`table tbody td[numero='${numero}']`);
			if (celda) {
				celda.classList.add('bg-danger', 'text-white');

				// Marcar el último número
				if (index === window.PREMIADOS.length - 1) {
					celda.classList.add('ultimo-numero');
					document.querySelector('[name=numero]').innerHTML = numero;
				}
				// Marcar el penúltimo número
				else if (index === window.PREMIADOS.length - 2) {
					celda.classList.add('penultimo-numero');
				}
			}
		});
	}

	// Actualizar el valor de velocidad mostrado
	const valorVelocidad = document.querySelector('#valorVelocidad');
	if (valorVelocidad) {
		valorVelocidad.textContent = window.CONFIG.segundos;
	}
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
	window.PREMIADOS.push(vuelta);
	// Guardar el estado después de sacar un número
	guardarEstadoJuego();
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

	// Cancelar cualquier timeout anterior para evitar múltiples timeouts activos
	if (window.miTimeOut) {
		clearTimeout(window.miTimeOut);
		window.miTimeOut = null;
	}

	// Iniciar la barra de progreso
	iniciarBarraProgreso();

	window.miTimeOut = setTimeout(function () {
		if (window.CONFIG.pausa) return;
		let numero = sacaNumero();
		if (numero === false) {
			console.log('Fin!');
			resetearBarraProgreso();
			return;
		}
		console.log(numero);
		document.querySelector('[name=numero]').innerHTML = numero;

		// Quitar la clase 'penultimo-numero' del número anterior al anterior
		const penultimoAnterior = document.querySelector('table tbody td.penultimo-numero');
		if (penultimoAnterior) {
			penultimoAnterior.classList.remove('penultimo-numero');
		}

		// El último número ahora se convierte en penúltimo
		const ultimoAnterior = document.querySelector('table tbody td.ultimo-numero');
		if (ultimoAnterior) {
			ultimoAnterior.classList.remove('ultimo-numero');
			ultimoAnterior.classList.add('penultimo-numero');
		}

		// Marcar el nuevo número con las clases correspondientes
		const celdaNueva = document.querySelector(`table tbody td[numero='${numero}']`);
		celdaNueva.classList.add('bg-danger', 'text-white', 'ultimo-numero');

		// Pausar la barra de progreso mientras se reproduce el audio
		pausarBarraProgreso();

		// Reproducir audio y esperar a que termine antes de continuar
		window.CONFIG.reproduciendoAudio = true;
		let speech = new SpeechSynthesisUtterance();
		speech.text = generarTextoAudio(numero);

		// Cuando el audio termine, marcar como no reproduciendo y continuar
		speech.onend = function() {
			window.CONFIG.reproduciendoAudio = false;
			// Solo continuar si no está en pausa y no está revisando números
			if (!window.CONFIG.pausa && !window.CONFIG.revisandoNumeros) {
				comienza();
			}
		};

		window.speechSynthesis.speak(speech);
	}, window.CONFIG.segundos * 1000);
}

function pausa() {
	window.CONFIG.pausa = !window.CONFIG.pausa;
	if (!window.CONFIG.pausa) {
		comienza();
	} else {
		// Si se pausa, cancelar el timeout activo y resetear la barra de progreso
		if (window.miTimeOut) {
			clearTimeout(window.miTimeOut);
			window.miTimeOut = null;
		}
		resetearBarraProgreso();
	}
	document.querySelector('button[name=btnPausa]').innerHTML = window.CONFIG.pausa
		? `<i class="bi bi-play-circle" style="font-size: 1.5rem;"></i>`
		: `<i class="bi bi-pause-fill" style="font-size: 1.5rem;"></i>`;
}

function cambiaVelocidad(incremento) {
	// Cambiar la velocidad sumando o restando el incremento
	let nuevaVelocidad = window.CONFIG.segundos + incremento;

	// Limitar entre 2 y 8 segundos
	if (nuevaVelocidad < 2) nuevaVelocidad = 2;
	if (nuevaVelocidad > 8) nuevaVelocidad = 8;

	window.CONFIG.segundos = nuevaVelocidad;
	document.querySelector('#valorVelocidad').textContent = nuevaVelocidad;

	// Deshabilitar botones según los límites
	const btnMasRapido = document.querySelector('#btnMasRapido');
	const btnMasLento = document.querySelector('#btnMasLento');

	if (btnMasRapido && btnMasLento) {
		btnMasRapido.disabled = (nuevaVelocidad <= 2);
		btnMasLento.disabled = (nuevaVelocidad >= 8);
	}

	// Guardar el estado cuando cambia la velocidad
	guardarEstadoJuego();
}

function iniciarBarraProgreso() {
	// Resetear la barra de progreso
	const progressBar = document.getElementById('progressBar');
	if (!progressBar) return;

	progressBar.style.width = '0%';
	window.CONFIG.progresoIniciado = Date.now();

	// Limpiar intervalo anterior si existe
	if (window.CONFIG.progresoIntervalo) {
		clearInterval(window.CONFIG.progresoIntervalo);
	}

	// Actualizar la barra cada 100ms
	window.CONFIG.progresoIntervalo = setInterval(() => {
		if (window.CONFIG.pausa || window.CONFIG.reproduciendoAudio) {
			// Si está pausado o reproduciendo audio, no actualizar
			return;
		}

		const tiempoTranscurrido = Date.now() - window.CONFIG.progresoIniciado;
		const tiempoTotal = window.CONFIG.segundos * 1000;
		const porcentaje = Math.min((tiempoTranscurrido / tiempoTotal) * 100, 100);

		progressBar.style.width = porcentaje + '%';

		if (porcentaje >= 100) {
			clearInterval(window.CONFIG.progresoIntervalo);
		}
	}, 100);
}

function pausarBarraProgreso() {
	if (window.CONFIG.progresoIntervalo) {
		clearInterval(window.CONFIG.progresoIntervalo);
		window.CONFIG.progresoIntervalo = null;
	}
}

function resetearBarraProgreso() {
	const progressBar = document.getElementById('progressBar');
	if (progressBar) {
		progressBar.style.width = '0%';
	}
	pausarBarraProgreso();
}

function reiniciar() {
	// Limpiar el estado guardado en localStorage
	limpiarEstadoJuego();
	// Recargar la página para reiniciar el juego
	window.location.reload(true);
}

function revisarNumeros() {
	// Si no hay números premiados, no hacer nada
	if (window.PREMIADOS.length === 0) {
		alert('No hay números para revisar todavía');
		return;
	}

	// Si ya está revisando, no hacer nada
	if (window.CONFIG.revisandoNumeros) {
		return;
	}

	// Pausar el juego si no está pausado
	if (!window.CONFIG.pausa) {
		pausa();
	}

	// Marcar que estamos revisando números
	window.CONFIG.revisandoNumeros = true;

	// Cancelar cualquier audio que esté sonando
	window.speechSynthesis.cancel();

	// Actualizar el botón de revisión para mostrar que está en proceso
	const btnRevisar = document.querySelector('a[name=btnRevisar]');
	const textoOriginal = btnRevisar ? btnRevisar.innerHTML : '';

	if (btnRevisar) {
		btnRevisar.classList.add('disabled');
		btnRevisar.innerHTML = '<i class="bi bi-hourglass-split"></i> Revisando...';
	}

	// Ordenar los números por valor ordinal (de menor a mayor)
	const numerosOrdenados = [...window.PREMIADOS].sort((a, b) => a - b);
	const totalNumeros = numerosOrdenados.length;

	// Primero decir cuántos números han salido
	let speechIntro = new SpeechSynthesisUtterance();
	speechIntro.text = `Han salido ${totalNumeros} numeros`;

	speechIntro.onend = function() {
		// Después del mensaje inicial, comenzar a reproducir los números
		reproducirNumero(0);
	};

	// Función recursiva para reproducir cada número con audio
	function reproducirNumero(index) {
		if (index >= numerosOrdenados.length) {
			// Terminamos de revisar todos los números, reproducir pitido
			reproducirPitido();
			return;
		}

		const numero = numerosOrdenados[index];
		console.log('Revisando número:', numero);

		// Mostrar el número en pantalla
		document.querySelector('[name=numero]').innerHTML = numero;

		// Crear el speech
		let speech = new SpeechSynthesisUtterance();
		speech.text = generarTextoAudio(numero);

		// Cuando termine este número, pasar al siguiente
		speech.onend = function() {
			// Esperar un poco entre números
			setTimeout(function() {
				reproducirNumero(index + 1);
			}, 500);
		};

		window.speechSynthesis.speak(speech);
	}

	// Función para reproducir el pitido final
	function reproducirPitido() {
		// Crear un contexto de audio para el pitido
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = 800; // Frecuencia del pitido en Hz
		oscillator.type = 'sine';

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.5);

		// Después del pitido, restaurar el estado
		setTimeout(function() {
			window.CONFIG.revisandoNumeros = false;

			// Restaurar el botón de revisión
			if (btnRevisar) {
				btnRevisar.classList.remove('disabled');
				btnRevisar.innerHTML = textoOriginal;
			}

			// El juego permanece pausado, el usuario debe reiniciarlo manualmente
		}, 600);
	}

	// Iniciar con el mensaje de introducción
	window.speechSynthesis.speak(speechIntro);
}
