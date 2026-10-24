// The conversation of the turns page (0.29.0, D180 to D182): twelve turns of a person's work with an AI
// engine, fictional, each with the person's message, a long answer and the facts of its line; one needs
// the person, one failed and the last one runs. English and Spanish, chosen by the page's language.
const words = {
	en: {
		title: 'Fix the checkout redirect',
		turns: 'Turns',
		messages: [
			'Look at the checkout redirect: after paying, people land on the cart again.',
			'Why does the session cookie disappear after the payment provider calls back?',
			'Write a failing test for it first, then fix it.',
			'Can you also check the same flow on mobile Safari?\nIt has its own cookie rules.',
			'Run the full checkout suite.',
			'Benchmark the redirect with the large cart fixture.',
			'Explain the change in two sentences for the pull request.',
			'Rename the helper to something that says what it keeps.',
			'Add a note to the changelog.',
			'Is the old fallback still needed?',
			'Remove it and run the tests again.',
			'Prepare the pull request.'
		],
		answer: 'The provider calls back on another site, so the browser treats the session cookie as a third-party cookie and drops it when SameSite is strict. The redirect then finds no session and sends the person to the cart. Keeping the cookie lax for that one route, and checking the state the provider returns, fixes it without widening anything else. ',
		facts: (index) => [index % 3 === 0 ? 'Changed 2 files' : null, `12:${String(index * 3 + 1).padStart(2, '0')}`, `${index + 1} min ${(index * 7) % 60} s`],
		needs: 'Needs you',
		placeholder: 'Message Claude Code…',
		label: 'Message to Claude Code',
		attach: 'Say what to do with the attached files'
	},
	es: {
		title: 'Corregir la redirección del pago',
		turns: 'Turnos',
		messages: [
			'Mira la redirección del pago: después de pagar, la gente vuelve al carrito.',
			'¿Por qué desaparece la cookie de sesión cuando responde el proveedor de pagos?',
			'Primero escribe una prueba que falle y después corrígelo.',
			'¿Puedes revisar el mismo flujo en Safari para móviles?\nTiene sus propias reglas de cookies.',
			'Ejecuta toda la batería del pago.',
			'Mide la redirección con el carrito grande de prueba.',
			'Explica el cambio en dos frases para el pull request.',
			'Cambia el nombre del helper por uno que diga qué guarda.',
			'Añade una nota al registro de cambios.',
			'¿Sigue haciendo falta la alternativa antigua?',
			'Quítala y vuelve a ejecutar las pruebas.',
			'Prepara el pull request.'
		],
		answer: 'El proveedor responde desde otro sitio, así que el navegador trata la cookie de sesión como de terceros y la descarta cuando SameSite es estricto. La redirección no encuentra sesión y manda a la persona al carrito. Dejar la cookie en lax solo para esa ruta, y comprobar el estado que devuelve el proveedor, lo corrige sin abrir nada más. ',
		facts: (index) => [index % 3 === 0 ? 'Cambió 2 archivos' : null, `12:${String(index * 3 + 1).padStart(2, '0')}`, `${index + 1} min ${(index * 7) % 60} s`],
		needs: 'Te necesita',
		placeholder: 'Escribe a Claude Code…',
		label: 'Mensaje a Claude Code',
		attach: 'Di qué hacer con los archivos adjuntos'
	}
};

/** The page's words in `language`. */
export const copy = language => words[language] ?? words.en;

/** The turns: a fresh copy each time, with their states and addresses. */
export function turns(language = 'en') {
	const { messages, answer, facts, needs } = copy(language);
	return messages.map((message, index) => ({
		key: `t${index + 1}`,
		message,
		answer: answer.repeat(index % 2 === 0 ? 4 : 2).trim(),
		summary: answer.split('. ')[0] + '.',
		facts: facts(index).filter(Boolean),
		state: index === 4 ? 'waiting' : index === 5 ? 'failed' : index === messages.length - 1 ? 'running' : null,
		stateLabel: index === 4 ? needs : null,
		href: `#turn=t${index + 1}`
	}));
}
