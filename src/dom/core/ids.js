/**
 * Unique element ids, so several instances on one page never share an accessible name or a
 * `aria-controls` target.
 */
export class Ids {
	static #count = 0;

	/** A new id with the given prefix. */
	static next(prefix = 'bui') {
		Ids.#count += 1;
		return `${prefix}-${Ids.#count}`;
	}
}
