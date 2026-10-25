/**
 * Where a row that scrolls sideways must rest for one of its parts to show whole, clear of what covers the
 * row's two ends (0.36.0, D179): the row's own padding, and the cue `ScrollEdges` draws at an end while that
 * end holds more (its fade and chevron). Only the arithmetic, so it is tested without a layout: offsets and
 * spans are pixels from the left edge of the row's scrolled content, which holds in either direction.
 *
 * Where the row rests decides which cues cover it, as `ScrollEdges` shows them: the left one once more than a
 * pixel is hidden beyond the left end, the right one while more than a pixel is hidden beyond the right end.
 * Resting at an end hides that end's cue, so a part the cue would cover just short of the end is shown from
 * the end itself.
 */
export class RowClearance {
	#width;
	#extent;
	#left;
	#right;

	/**
	 * @param {object} row
	 * @param {number} row.width the row's visible width (its client width)
	 * @param {number} row.extent how far the row scrolls: its scroll width less its client width
	 * @param {{padding?: number, cue?: number}} [row.left] what covers the left end: the row's padding, and how far its cue reaches into the row while shown
	 * @param {{padding?: number, cue?: number}} [row.right] the same at the right end
	 */
	constructor({ width, extent, left = {}, right = {} }) {
		this.#width = Math.max(0, width || 0);
		this.#extent = Math.max(0, extent || 0);
		// The padding keeps a part off an end wherever the row rests; the cue covers the end only while shown
		this.#left = Math.max(0, left.padding || 0, left.cue || 0);
		this.#right = Math.max(0, right.padding || 0, right.cue || 0);
	}

	/**
	 * Where the row rests for the part from `start` to `end` to show whole and clear: `now` when it already
	 * does, else the nearest whole pixel that clears it, moving at least as far as needed (WebKit keeps only
	 * whole pixels of `scrollLeft`, so a fraction short would leave the part a fraction under a cue). A part
	 * wider than the room between the ends keeps its `lead` edge clear: its inline start, `left` in a
	 * left-to-right row and `right` in a right-to-left one.
	 *
	 * @param {{now: number, start: number, end: number, lead?: 'left'|'right'}} part
	 * @returns {number} the offset to rest at, from 0 to the row's extent
	 */
	rest({ now, start, end, lead = 'left' }) {
		const low = this.#low(end);
		const high = this.#high(start);
		if (low <= now && now <= high) return now;
		// Clear the edge that is covered, or the lead when no offset clears both
		const edge = low > high ? lead : now < low ? 'right' : 'left';
		return edge === 'right' ? Math.min(this.#extent, Math.ceil(low)) : Math.max(0, Math.floor(high));
	}

	/** Whether the part from `start` to `end` shows whole and clear with the row resting at `now`. */
	clear({ now, start, end }) {
		return this.#low(end) <= now && now <= this.#high(start);
	}

	/** The least offset at which the part's right edge, `end`, is clear of the row's right end. */
	#low(end) {
		// With the right cue shown, as it is anywhere short of the row's last pixel
		const covered = end - this.#width + this.#right;
		return covered < this.#extent - 1 ? Math.max(0, covered) : this.#extent;
	}

	/** The greatest offset at which the part's left edge, `start`, is clear of the row's left end. */
	#high(start) {
		// With the left cue shown, as it is anywhere past the row's first pixel
		const covered = start - this.#left;
		return covered > 1 ? Math.min(this.#extent, covered) : 0;
	}
}
