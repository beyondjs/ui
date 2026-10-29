/** The words of `Status`'s states in English and Spanish (0.15.0): the family's one vocabulary (D105's five conditions among them). */
export const words = Object.freeze({
	en: Object.freeze({ ready: 'Ready', busy: 'Busy', waking: 'Waking up', asleep: 'Asleep', attention: 'Needs attention', unavailable: 'Not available right now', failed: 'Failed', unknown: 'Unknown', success: 'Done', running: 'Running', idle: 'Idle', pending: 'Waiting', stopped: 'Stopped', done: 'Done' }),
	es: Object.freeze({ ready: 'Lista', busy: 'Ocupada', waking: 'Despertando', asleep: 'Dormida', attention: 'Requiere atención', unavailable: 'No disponible ahora', failed: 'Falló', unknown: 'Desconocido', success: 'Hecho', running: 'En curso', idle: 'Inactiva', pending: 'En espera', stopped: 'Detenida', done: 'Hecho' })
});

/**
 * Each state's tone, which is its shape and its hue together: `success` a filled circle, `progress` a
 * half-filled circle, `attention` a diamond, `failure` a square, `idle` a hollow circle, `unknown` a dashed
 * circle. The earlier tones of `status()` keep their names: `warning` is drawn as attention, `danger` as
 * failure, `neutral` and `info` as a filled circle in their hue.
 */
export const tones = Object.freeze({
	ready: 'success',
	done: 'success',
	success: 'success',
	busy: 'progress',
	running: 'progress',
	waking: 'progress',
	attention: 'attention',
	unavailable: 'attention',
	pending: 'idle',
	asleep: 'idle',
	stopped: 'idle',
	idle: 'idle',
	failed: 'failure',
	unknown: 'unknown'
});
