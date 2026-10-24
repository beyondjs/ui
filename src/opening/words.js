/**
 * The opening's words in the family's two languages (0.21.0, said again from the person's side in
 * 0.25.0): its own lines and the steps a product names on its waiting element
 * (`data-bui-opening-wait="session"`). `{product}` is the product's name, `{time}` a duration and
 * `{version}` a version of the package; all three are values, never translated.
 */
export const words = Object.freeze({
	en: Object.freeze({
		opening: 'Opening {product}',
		interface: 'Loading {product}',
		session: 'Confirming your session',
		signin: 'Signing you in with Beyond Accounts',
		projects: 'Connecting to Beyond Projects',
		usual: 'usually {time}',
		longer: '{step} is taking longer than usual',
		late: 'Taking longer than expected',
		wait: 'You can keep waiting or reload.',
		failed: 'Couldn’t open {product}',
		offline: 'You’re offline',
		reconnect: 'Opening continues as soon as you’re back online.',
		outdated: '{product}’s development server is out of date. Stop it and start it again, then reload.',
		reload: 'Reload',
		details: 'Technical details',
		copy: 'Copy details',
		copied: 'Copied',
		refused: 'Couldn’t copy. The details are selected: copy them with your keyboard.',
		step: 'Step',
		steps: 'Steps',
		error: 'Error',
		unloaded: 'Couldn’t load {address}',
		version: 'Opening',
		page: 'Page drawn by',
		earlier: 'an earlier version',
		address: 'Address',
		time: 'Time',
		fallback: '{product} hasn’t opened yet. Reload this page to try again.',
		disabled: 'Turn on JavaScript in your browser to open {product}.'
	}),
	es: Object.freeze({
		opening: 'Abriendo {product}',
		interface: 'Cargando {product}',
		session: 'Confirmando tu sesión',
		signin: 'Iniciando tu sesión con Beyond Accounts',
		projects: 'Conectando con Beyond Projects',
		usual: 'normalmente {time}',
		longer: '{step} está tardando más de lo normal',
		late: 'Está tardando más de lo esperado',
		wait: 'Puedes seguir esperando o volver a cargar.',
		failed: 'No se pudo abrir {product}',
		offline: 'Estás sin conexión',
		reconnect: 'La apertura continúa en cuanto vuelvas a tener conexión.',
		outdated: 'El servidor de desarrollo de {product} está desactualizado. Detenlo, vuelve a iniciarlo y vuelve a cargar.',
		reload: 'Volver a cargar',
		details: 'Detalles técnicos',
		copy: 'Copiar detalles',
		copied: 'Copiado',
		refused: 'No se pudo copiar. Los detalles están seleccionados: cópialos con el teclado.',
		step: 'Paso',
		steps: 'Pasos',
		error: 'Error',
		unloaded: 'No se pudo cargar {address}',
		version: 'Apertura',
		page: 'Página generada por',
		earlier: 'una versión anterior',
		address: 'Dirección',
		time: 'Hora',
		fallback: '{product} aún no se ha abierto. Vuelve a cargar esta página para intentarlo de nuevo.',
		disabled: 'Activa JavaScript en tu navegador para abrir {product}.'
	})
});

/** The steps a product may name on its waiting element; any other value is said in the product's own words. */
export const steps = Object.freeze(['session', 'signin', 'projects']);

/**
 * The opening's words in the document's language, read at each use so a language the product applies
 * on arrival (the account's, D07) is the one said next.
 */
export class OpeningWords {
	#product;

	constructor(product) {
		this.#product = product;
	}

	/** The product's name, a value never translated */
	get product() {
		return this.#product;
	}

	get language() {
		return globalThis.document?.documentElement.lang?.toLowerCase().startsWith('es') ? 'es' : 'en';
	}

	/** A line with its values: `text('late')`, `text('usual', { time })` */
	text(key, values = {}) {
		const all = { product: this.#product, ...values };
		return (words[this.language][key] ?? words.en[key] ?? '').replace(/\{(\w+)\}/g, (match, name) => (name in all ? String(all[name]) : match));
	}

	/** A step's words: the family's for a named step, else the product's own text, else "Opening {product}" */
	step(id, own = '') {
		if (id === 'interface' || steps.includes(id)) return this.text(id);
		const text = String(own ?? '').replace(/\s+/g, ' ').trim().replace(/(…|\.\.\.)$/, '').trim();
		return text || this.text('opening');
	}

	/**
	 * A step the product does not name, in its own words from its waiting element: its status line, else its
	 * first line of text, to the end of the first sentence; what a region adds later below that line starts
	 * no new step (0.21.2)
	 */
	line(pending) {
		const status = pending.matches('[role="status"]') ? pending : pending.querySelector('[role="status"]');
		const leaf = [...(status ?? pending).querySelectorAll('*')].find(node => !node.children.length && node.textContent.trim());
		const text = (leaf ?? status ?? pending).textContent.replace(/\s+/g, ' ').trim();
		return text.split(/(?<=[.…!?])\s/)[0];
	}

	/** A duration as a person reads it: "< 0.1 s", "0.4 s", "12 s", "1 min 5 s" (decimals in the document's language) */
	time(ms) {
		const seconds = Math.max(0, ms) / 1000;
		if (seconds < 0.1) return `< ${new Intl.NumberFormat(this.language, { minimumFractionDigits: 1 }).format(0.1)} s`;
		if (seconds >= 60) return `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s`;
		const digits = seconds < 10 ? 1 : 0;
		return `${new Intl.NumberFormat(this.language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(digits ? seconds : Math.floor(seconds))} s`;
	}
}
