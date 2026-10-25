import { Motion } from '../core/motion.js';
import { Relayout } from '../core/relayout.js';

/** The contextual panel's visibility and motion, without animating its live content. */
export class SidebarContext {
	#host;
	#panel;
	#motion;
	#visible = null;

	constructor(host, panel, later) {
		this.#host = host;
		this.#panel = panel;
		this.#motion = new Motion(panel, later);
	}

	/** Keeps the panel's space through exit; a reversal or a mobile cut cancels that exit. */
	show({ wide, enabled, shown }) {
		this.#host.toggleAttribute('data-rail', enabled);
		const visible = wide && (!enabled || shown);
		const previous = this.#visible;
		const animate = wide && enabled && previous !== null;
		this.#visible = visible;
		// The width changes with both: told once, after both are drawn, so a listener that measures at once reads it
		const paint = () => {
			const marked = this.#host.hasAttribute('data-panel') !== Boolean(shown);
			this.#host.toggleAttribute('data-panel', shown);
			if (this.#panel.hidden !== !visible) Relayout.hide(this.#panel, !visible, this.#host);
			else if (marked) Relayout.tell(this.#host);
		};
		if (visible === previous && animate) {
			if (!this.#motion.leaving) paint();
			return;
		}
		this.#motion.stop();
		if (!visible && previous && animate) {
			this.#motion.leave(paint);
			return;
		}
		paint();
		if (visible && !previous && animate) this.#motion.enter();
	}

	/** Cancels motion before the Sidebar releases its elements and timers. */
	destroy() { this.#motion.stop(); }
}
