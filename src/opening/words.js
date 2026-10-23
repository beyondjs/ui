/**
 * The opening's words in the family's two languages (0.21.0): its own lines and the steps a product
 * names on its waiting element (`data-bui-opening-wait="session"`). `{product}` is the product's name
 * and `{time}` a duration; both are values, never translated.
 */
export const words = Object.freeze({
	en: Object.freeze({
		opening: 'Opening {product}',
		interface: 'Loading {product}',
		session: 'Confirming your session',
		signin: 'Signing you in with Beyond Accounts',
		projects: 'Connecting Beyond Projects',
		usual: 'usually {time}',
		longer: '{step} is taking longer than usual',
		late: '{product} hasn’t opened yet',
		keeps: 'It keeps trying. Reload if it doesn’t finish.',
		stopped: 'Something failed while it opened. Reload to try again.',
		failed: '{product} couldn’t load',
		again: 'Reload to try again.',
		offline: 'You’re offline',
		reconnect: '{product} continues when you reconnect.',
		reload: 'Reload',
		details: 'Technical details',
		copy: 'Copy details',
		copied: 'Copied',
		refused: 'Could not copy. The details are selected: copy them with your keyboard.',
		step: 'Step',
		steps: 'Steps',
		error: 'Error',
		address: 'Address',
		time: 'Time',
		fallback: '{product} hasn’t opened. Reload this page to try again.',
		disabled: 'Enable JavaScript in your browser to open this product.'
	}),
	es: Object.freeze({
		opening: 'Abriendo {product}',
		interface: 'Cargando {product}',
		session: 'Confirmando tu sesión',
		signin: 'Iniciando tu sesión con Beyond Accounts',
		projects: 'Conectando con Beyond Projects',
		usual: 'normalmente {time}',
		longer: '{step} está tardando más de lo normal',
		late: '{product} aún no se ha abierto',
		keeps: 'Sigue intentándolo. Vuelve a cargar si no termina.',
		stopped: 'Algo falló al abrir. Vuelve a cargar para intentarlo de nuevo.',
		failed: '{product} no se pudo cargar',
		again: 'Vuelve a cargar para intentarlo de nuevo.',
		offline: 'Estás sin conexión',
		reconnect: '{product} continúa cuando vuelvas a conectarte.',
		reload: 'Volver a cargar',
		details: 'Detalles técnicos',
		copy: 'Copiar detalles',
		copied: 'Copiado',
		refused: 'No se pudo copiar. Los detalles están seleccionados: cópialos con el teclado.',
		step: 'Paso',
		steps: 'Pasos',
		error: 'Error',
		address: 'Dirección',
		time: 'Hora',
		fallback: '{product} no se ha abierto. Vuelve a cargar esta página para intentarlo de nuevo.',
		disabled: 'Activa JavaScript en tu navegador para abrir este producto.'
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

	/** A duration as a person reads it: "0.4 s", "12 s", "1 min 5 s" (decimals in the document's language) */
	time(ms) {
		const seconds = Math.max(0, ms) / 1000;
		if (seconds >= 60) return `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s`;
		const digits = seconds < 10 ? 1 : 0;
		return `${new Intl.NumberFormat(this.language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(digits ? seconds : Math.floor(seconds))} s`;
	}
}
