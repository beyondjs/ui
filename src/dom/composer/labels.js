/**
 * The copy of `Composer` in English and Spanish: the default action, the split menu's name, the
 * keyboard hint read with the field (by the way the composer sends), and what it says when a message
 * is empty or was not sent. Public as `Composer.labels`.
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
		failed: 'Not sent. Your message is still here.'
	},
	es: {
		send: 'Enviar',
		more: 'Más formas de enviar',
		busy: '{label}…',
		enter: 'Intro envía. Mayús+Intro añade una línea.',
		mod: '{key}+Intro envía. Intro añade una línea.',
		touch: 'Intro añade una línea. Usa «{action}» para enviar.',
		empty: 'Escribe un mensaje primero.',
		failed: 'No se envió. Tu mensaje sigue aquí.'
	}
});
