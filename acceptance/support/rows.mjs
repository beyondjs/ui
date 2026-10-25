/**
 * What a person sees of every row of tabs on each frame, from the page's first (0.36.0, D179). `install(context)`
 * runs before any page script: on every animation frame it creates a fresh `ResizeObserver`, whose first callback
 * comes last in that frame's rendering, after the package's own observers have scrolled their rows and before the
 * frame is painted; there it reads each row (`.bui-productnav`): the list's box, its current tab's box and words,
 * every cue drawn (a `.bui-scroll-edge` not hidden), which ends hold more and how many of the page's font faces
 * have loaded. It stops once rows are drawn and the fonts have loaded and `span` milliseconds of frames followed,
 * or after `bound` milliseconds.
 */
export class RowFrames {
	/** Installs the recorder in a browser context, before any page script runs. */
	static install(context, { span = 400, bound = 8000 } = {}) {
		return context.addInitScript(record, { span, bound });
	}

	#page;

	/** @param {import('playwright-core').Page} page */
	constructor(page) {
		this.#page = page;
	}

	/** Waits until the recorder stopped and returns its frames. */
	async read() {
		await this.#page.waitForFunction(() => window.__rows?.done, null, { timeout: 20_000 });
		return this.#page.evaluate(() => window.__rows.samples);
	}

	/**
	 * Every row whose current tab was not whole on a frame: cut by the row's own edge or under a cue drawn,
	 * within half a pixel; each says its frame's time (`at`) and, in `text`, the row's name and the boxes.
	 */
	static cut(samples) {
		const found = [];
		for (const sample of samples) {
			for (const row of sample.rows.filter(item => item.tab && item.row?.width)) {
				const { tab } = row;
				const inside = tab.left >= row.row.left - 0.5 && tab.right <= row.row.right + 0.5;
				const under = row.cues.filter(cue => tab.right > cue.left + 0.5 && tab.left < cue.right - 0.5);
				const boxes = `"${tab.text}" ${Math.round(tab.left)}–${Math.round(tab.right)} in ${Math.round(row.row.left)}–${Math.round(row.row.right)}${under.map(cue => ` under a cue ${Math.round(cue.left)}–${Math.round(cue.right)}`).join('')}`;
				if (!inside || under.length) found.push({ at: sample.at, text: `${sample.at} ms "${row.name}": ${boxes}` });
			}
		}
		return found;
	}
}

/** The page's side of `RowFrames`: one read per frame, at the end of its rendering. */
function record({ span, bound }) {
	const state = { samples: [], done: false };
	window.__rows = state;
	const started = performance.now();
	const box = node => {
		const rect = node.getBoundingClientRect();
		return { left: rect.left, right: rect.right, width: rect.width };
	};
	const read = () =>
		[...document.querySelectorAll('.bui-productnav')].map(nav => {
			const list = nav.querySelector('.bui-productnav-list');
			const current = list?.querySelector('[aria-current]');
			return {
				name: nav.getAttribute('aria-label') ?? '',
				row: list ? box(list) : null,
				tab: current ? { ...box(current), text: current.textContent } : null,
				cues: [...nav.querySelectorAll('.bui-scroll-edge')].filter(cue => !cue.hidden && cue.getClientRects().length).map(box),
				more: nav.dataset.more ?? '',
				scroll: list?.scrollLeft ?? 0
			};
		});
	let settled = null;
	const frame = () => {
		if (state.done) return;
		const observer = new ResizeObserver(() => {
			observer.disconnect();
			if (state.done) return;
			const at = Math.round(performance.now() - started);
			const fonts = [...document.fonts].filter(face => face.status === 'loaded').length;
			const rows = read();
			state.samples.push({ at, fonts, status: document.fonts.status, rows });
			if (rows.length && fonts > 0 && document.fonts.status === 'loaded') settled ??= at;
			if ((settled !== null && at - settled >= span) || at >= bound) state.done = true;
		});
		observer.observe(document.documentElement);
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}
