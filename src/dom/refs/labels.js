/** The copy of `RefChooser` in English and Spanish (`RefChooser.labels`). */
export const labels = Object.freeze({
	en: Object.freeze({
		label: 'Branch',
		default: 'Default',
		custom: 'Commit or other ref',
		escape: 'Use a commit or another ref…',
		loading: 'Loading branches…',
		unavailable: 'Couldn’t read the branches.',
		retry: 'Try again',
		empty: 'No branches to choose from.',
		search: 'Search branches',
		none: ({ query }) => `No branches match “${query}”.`,
		other: 'Commit or ref',
		hint: 'A branch, a tag or a commit, as Git names it.',
		use: 'Use',
		cancel: 'Cancel',
		required: 'Enter a branch, a tag or a commit.',
		invalid: 'Git can’t use this name: no spaces, no “..” and none of ~ ^ : ? * [ \\.'
	}),
	es: Object.freeze({
		label: 'Rama',
		default: 'Predeterminada',
		custom: 'Commit u otra referencia',
		escape: 'Usar un commit u otra referencia…',
		loading: 'Cargando las ramas…',
		unavailable: 'No se pudieron leer las ramas.',
		retry: 'Reintentar',
		empty: 'No hay ramas para elegir.',
		search: 'Buscar ramas',
		none: ({ query }) => `Ninguna rama coincide con «${query}».`,
		other: 'Commit o referencia',
		hint: 'Una rama, una etiqueta o un commit, como lo nombra Git.',
		use: 'Usar',
		cancel: 'Cancelar',
		required: 'Escribe una rama, una etiqueta o un commit.',
		invalid: 'Git no puede usar este nombre: sin espacios, sin «..» y sin ~ ^ : ? * [ \\.'
	})
});
