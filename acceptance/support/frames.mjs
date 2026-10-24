/**
 * What a person sees of a page's composers on every frame while a resize lands (0.32.0). A recorder in the page
 * asks for every animation frame and, from each one, posts a task that runs once that frame is painted: the task
 * reads each composer as it was painted, its box (left, width and height), where its text and its toolbar's first
 * control (the +, else the first shown item) start from the box's edge, how many rows its toolbar takes and the
 * toolbar's level (`data-fit`, with `bare`). A task that finds the window another width than its frame began with
 * read a layout no frame painted (the viewport changed in between) and says so (`painted: false`). The recorder
 * stops by itself once `span` milliseconds of frames at the new width are read, or after `bound` milliseconds.
 */
export class Frames {
	#page;

	/** @param {import('playwright-core').Page} page */
	constructor(page) {
		this.#page = page;
	}

	/** Starts recording the composers `selectors` name, until `span` ms of frames at `width` are read. */
	start(selectors, { width, span = 300, bound = 4000 }) {
		return this.#page.evaluate(record, { selectors, width, span, bound });
	}

	/** Waits until the recorder stopped and returns its frames. */
	async read() {
		await this.#page.waitForFunction(() => window.__frames?.done, null, { timeout: 10_000 });
		return this.#page.evaluate(() => window.__frames.samples);
	}
}

/**
 * The frames of a resize read against the settled one (0.32.0): the first painted frame at the new width is the
 * frame the resize lands; the settled geometry is the last frame's. A frame is misplaced when any of its measures
 * differs from the settled one by more than `tolerance` pixels, or its toolbar takes another number of rows or
 * another level.
 */
export class Settling {
	static measures = ['left', 'width', 'height', 'text', 'start'];

	#samples;
	#width;
	#tolerance;

	/**
	 * @param {Array<object>} samples what `Frames.read()` returned
	 * @param {number} width the window's width after the resize
	 * @param {number} [tolerance] pixels a measure may differ from the settled one
	 */
	constructor(samples, width, tolerance = 1) {
		this.#samples = samples;
		this.#width = width;
		this.#tolerance = tolerance;
	}

	/** The painted frames from the one the resize lands on. */
	get frames() {
		const index = this.#landing();
		return index < 0 ? [] : this.#samples.slice(index).filter(sample => sample.painted);
	}

	/** The last painted frame's composers before the resize landed. */
	get before() {
		const index = this.#landing();
		return this.#samples.slice(0, index < 0 ? undefined : index).findLast(sample => sample.painted)?.composers ?? [];
	}

	/** The last frame's composers. */
	get settled() {
		return this.frames.at(-1)?.composers ?? [];
	}

	/** The frames whose composers are not the settled ones, with what differed. */
	get misplaced() {
		const settled = this.settled;
		const found = [];
		for (const [index, frame] of this.frames.entries()) {
			const differences = frame.composers.flatMap((composer, at) => this.#differences(composer, settled[at]).map(text => `#${at} ${text}`));
			if (differences.length) found.push({ index, at: frame.at, differences });
		}
		return found;
	}

	/** One line per frame, for a report: its time from the landing frame and each composer's measures. */
	lines() {
		const frames = this.frames;
		const start = frames[0]?.at ?? 0;
		const said = composer => (composer ? `w${composer.width} x${composer.left} h${composer.height} text${composer.text} first${composer.start} rows${composer.rows} ${composer.fit}` : 'none');
		return frames.map((frame, index) => `${String(index).padStart(2)} +${String(frame.at - start).padStart(3)}ms ${frame.composers.map(said).join(' | ')}`);
	}

	#landing() {
		return this.#samples.findIndex(sample => sample.painted && sample.width === this.#width);
	}

	#differences(composer, settled) {
		if (!composer || !settled) return composer === settled ? [] : ['drawn or not'];
		const found = Settling.measures.filter(name => Math.abs(composer[name] - settled[name]) > this.#tolerance).map(name => `${name} ${composer[name]} (settled ${settled[name]})`);
		for (const name of ['rows', 'fit']) if (composer[name] !== settled[name]) found.push(`${name} ${composer[name]} (settled ${settled[name]})`);
		return found;
	}
}

/** The page's side of `Frames`: one task after each painted frame, reading each composer as it was painted. */
function record({ selectors, width, span, bound }) {
	const leaves = bar => {
		const groups = ['bui-composer-start', 'bui-composer-settings', 'bui-composer-tools', 'bui-composer-end', 'bui-composer-extras'];
		const found = [];
		const walk = node => {
			for (const child of node.children) {
				if (child.matches('input, .bui-hidden, [hidden]')) continue;
				if (groups.some(name => child.classList.contains(name)) || getComputedStyle(child).display === 'contents') walk(child);
				else if (child.getClientRects().length) found.push(child.getBoundingClientRect());
			}
		};
		walk(bar);
		return found.filter(box => box.width || box.height);
	};
	// Rows: the bands the toolbar's leaves take, a leaf joining the band its middle falls in
	const rows = boxes => {
		const bands = [];
		for (const box of [...boxes].sort((a, b) => a.top - b.top)) {
			const middle = box.top + box.height / 2;
			if (!bands.some(band => middle >= band.top && middle <= band.bottom)) bands.push({ top: box.top, bottom: box.bottom });
		}
		return bands.length;
	};
	const round = value => Math.round(value * 10) / 10;
	const read = selector => {
		const root = document.querySelector(selector);
		const box = root?.querySelector('.bui-composer-box')?.getBoundingClientRect();
		if (!box || !root.getClientRects().length) return null;
		const field = root.querySelector('.bui-composer-field');
		const text = field.getBoundingClientRect().left + parseFloat(getComputedStyle(field).paddingLeft);
		const items = leaves(root.querySelector('.bui-composer-bar'));
		const plus = root.querySelector('.bui-composer-plus');
		const first = plus?.getClientRects().length ? plus.getBoundingClientRect().left : Math.min(...items.map(item => item.left));
		const fit = `${root.dataset.fit ?? 'full'}${root.hasAttribute('data-bare') ? ' bare' : ''}`;
		return { left: round(box.left), width: round(box.width), height: round(box.height), text: round(text - box.left), start: round(first - box.left), rows: rows(items), fit };
	};
	const state = { samples: [], done: false, frame: 0 };
	window.__frames = state;
	const begun = performance.now();
	let landed = null;
	let began = innerWidth;
	const channel = new MessageChannel();
	channel.port1.onmessage = () => {
		const now = performance.now();
		const painted = innerWidth === began;
		if (painted && began === width && landed === null) landed = now;
		state.samples.push({ frame: state.frame, at: Math.round(now - begun), width: began, painted, composers: selectors.map(read) });
		if ((landed !== null && now - landed >= span) || now - begun >= bound) state.done = true;
	};
	const tick = () => {
		if (state.done) return;
		state.frame += 1;
		began = innerWidth;
		channel.port2.postMessage(null);
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}
