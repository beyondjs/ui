/**
 * The copy of `Composer` in English and Spanish: the default action, the split menu's name, the
 * keyboard hint read with the field (by the way the composer sends), and what it says when a message
 * is empty or was not sent; since 0.11.0 its attachments (Attach, the drop target, the chips' states and
 * what is announced) and its suggestions (their states and what is announced); since 0.11.1 the narrow
 * toolbar's Options and a truncated list's last line; since 0.11.2 a file the product refused. Public as
 * `Composer.labels`.
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const composer = freeze({
	en: {
		send: 'Send',
		more: 'More ways to send',
		busy: '{label}…',
		enter: 'Enter sends. Shift+Enter adds a line.',
		mod: '{key}+Enter sends. Enter adds a line.',
		touch: 'Enter adds a line. Use {action} to send.',
		empty: 'Write a message first.',
		failed: 'Not sent. Your message is still here.',
		attach: 'Attach',
		drop: 'Drop files to attach',
		files: 'Attachments',
		bytes: '{count} B',
		remove: 'Remove {name}',
		retry: 'Retry',
		uploading: 'Uploading {percent}',
		rejected: 'Failed · {reason}',
		refused: 'Not attached · {reason}',
		failure: '{name} failed: {reason}',
		turned: '{name} not attached: {reason}',
		unknown: 'no reason given',
		attached: '{name} attached',
		sending: '{name} uploading',
		removed: '{name} removed',
		suggestions: 'Suggestions',
		looking: 'Looking…',
		nomatch: 'No match',
		unavailable: 'Unavailable · {reason}',
		late: 'didn’t answer in time',
		unread: 'couldn’t be read',
		suggested: ({ count }) => (count === 1 ? '1 suggestion' : `${count} suggestions`),
		options: 'Options',
		narrow: ({ count, total }) => (total ? `${count} of ${total} · keep typing to narrow` : `First ${count} · keep typing to narrow`),
		narrowed: ({ count, total }) => (total ? `${count} of ${total} suggestions · keep typing to narrow` : `First ${count} suggestions · keep typing to narrow`)
	},
	es: {
		send: 'Enviar',
		more: 'Más formas de enviar',
		busy: '{label}…',
		enter: 'Intro envía. Mayús+Intro añade una línea.',
		mod: '{key}+Intro envía. Intro añade una línea.',
		touch: 'Intro añade una línea. Usa «{action}» para enviar.',
		empty: 'Escribe un mensaje primero.',
		failed: 'No se envió. Tu mensaje sigue aquí.',
		attach: 'Adjuntar',
		drop: 'Suelta los archivos para adjuntarlos',
		files: 'Adjuntos',
		bytes: '{count} B',
		remove: 'Quitar {name}',
		retry: 'Reintentar',
		uploading: 'Subiendo {percent}',
		rejected: 'Falló · {reason}',
		refused: 'No adjuntado · {reason}',
		failure: '{name} falló: {reason}',
		turned: '{name} no se adjuntó: {reason}',
		unknown: 'sin motivo indicado',
		attached: '{name} adjuntado',
		sending: '{name} subiéndose',
		removed: '{name} quitado',
		suggestions: 'Sugerencias',
		looking: 'Buscando…',
		nomatch: 'Sin coincidencias',
		unavailable: 'No disponible · {reason}',
		late: 'no respondió a tiempo',
		unread: 'no se pudo leer',
		suggested: ({ count }) => (count === 1 ? '1 sugerencia' : `${count} sugerencias`),
		options: 'Opciones',
		narrow: ({ count, total }) => (total ? `${count} de ${total} · sigue escribiendo para acotar` : `Primeras ${count} · sigue escribiendo para acotar`),
		narrowed: ({ count, total }) => (total ? `${count} de ${total} sugerencias · sigue escribiendo para acotar` : `Primeras ${count} sugerencias · sigue escribiendo para acotar`)
	}
});
