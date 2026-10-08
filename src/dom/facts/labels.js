/**
 * The copy of `Facts` and `Meter` in English and Spanish (`Facts.labels`, `Meter.labels`): a stale
 * row's default note, and a meter's words for its use, its levels, its reset and a report that is not
 * current.
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const labels = freeze({
	en: { stale: 'Not current' },
	es: { stale: 'No actualizado' }
});

export const meter = freeze({
	en: {
		used: '{percent} used',
		warning: 'Near the limit',
		danger: 'Almost at the limit',
		full: 'Limit reached',
		unknown: 'Not reported',
		reset: 'Resets {time}',
		stale: 'Not reported since {time}',
		unreported: 'Not reported lately',
		passed: 'Reset since {time} · use not reported since'
	},
	es: {
		used: '{percent} usado',
		warning: 'Cerca del límite',
		danger: 'Casi en el límite',
		full: 'Límite alcanzado',
		unknown: 'Sin datos',
		reset: 'Se reinicia {time}',
		stale: 'Sin datos desde {time}',
		unreported: 'Sin datos recientes',
		passed: 'Reiniciado desde {time} · sin datos de uso desde entonces'
	}
});
