/**
 * The copy of a composer's dictation (`ComposerDictation`, 0.14.0) in English and Spanish: the Dictate
 * button, the line's states and actions, each failure in words, why a recording stopped and what is
 * announced. Public as `ComposerDictation.labels`.
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const dictation = freeze({
	en: {
		dictate: 'Dictate',
		asking: 'Allow the microphone to dictate',
		recording: 'Recording',
		transcribing: 'Transcribing…',
		time: '{elapsed} / {cap}',
		left: '{seconds} seconds left',
		added: 'Text added to your message',
		stop: 'Stop',
		cancel: 'Cancel',
		retry: 'Try again',
		dismiss: 'Dismiss',
		discard: 'Discard',
		transcribe: 'Transcribe what was recorded',
		denied: 'Microphone access is blocked. Allow this site in your browser settings, then try again.',
		missing: 'No microphone was found.',
		busy: 'The microphone is in use by another app.',
		interrupted: 'Recording stopped: {why}.',
		ended: 'the microphone was disconnected',
		hidden: 'the page was hidden',
		broken: 'the recording failed',
		short: 'Too short to transcribe.',
		none: 'No speech was recognized.',
		unavailable: 'Dictation isn’t available now. Your recording is kept.'
	},
	es: {
		dictate: 'Dictar',
		asking: 'Permite el micrófono para dictar',
		recording: 'Grabando',
		transcribing: 'Transcribiendo…',
		time: '{elapsed} / {cap}',
		left: 'Quedan {seconds} segundos',
		added: 'Texto añadido a tu mensaje',
		stop: 'Detener',
		cancel: 'Cancelar',
		retry: 'Reintentar',
		dismiss: 'Cerrar',
		discard: 'Descartar',
		transcribe: 'Transcribir lo grabado',
		denied: 'El micrófono está bloqueado. Permite su uso para este sitio en el navegador y reintenta.',
		missing: 'No se encontró ningún micrófono.',
		busy: 'Otra aplicación está usando el micrófono.',
		interrupted: 'Grabación detenida: {why}.',
		ended: 'el micrófono se desconectó',
		hidden: 'la página quedó oculta',
		broken: 'la grabación falló',
		short: 'Demasiado corto para transcribir.',
		none: 'No se reconoció ninguna voz.',
		unavailable: 'El dictado no está disponible ahora. Tu grabación se conserva.'
	}
});
