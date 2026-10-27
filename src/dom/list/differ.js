/**
 * Whether the rows in view differ in an attribute (0.44.0, the list rule L3): a row says where it is, its
 * machine, its author or its area only when the rows around it do not all share it. `new Differ(rows)`
 * once per drawing, then `differ.in(row => row.machine)` for each attribute; `Differ.of(rows, pick)` for
 * one. Empty values (null, undefined, '') never count as a difference, so one machine and rows with none
 * still share it. Values are compared as they are (`===`, a `Set`): pick a key, not an object.
 */
export class Differ {
	#rows;

	/** @param {Iterable<object>} rows the rows in view, usually one page */
	constructor(rows) {
		this.#rows = [...(rows ?? [])];
	}

	/**
	 * True when the rows hold two values or more of what `pick` gives
	 *
	 * @param {(row: object) => unknown} pick
	 */
	in(pick) {
		const values = new Set();
		for (const row of this.#rows) {
			const value = pick(row);
			if (value === null || value === undefined || value === '') continue;
			values.add(value);
			if (values.size > 1) return true;
		}
		return false;
	}

	/** One attribute's answer for some rows */
	static of(rows, pick) {
		return new Differ(rows).in(pick);
	}
}
