/**
 * What a component was last drawn from, kept so that being given the same data again draws nothing new
 * (0.17.1). Plain data (objects, arrays, strings, numbers, booleans, null) is compared by content and
 * copied, so a product that changes an object in place and sets it again is still heard; anything else
 * (a function, a node, an instance) is compared by identity.
 */
export class Same {
	#value;
	#kept = false;

	/** Keeps `value` and answers whether it equals the value kept before (false the first time). */
	keep(value) {
		const same = this.#kept && Same.equal(this.#value, value);
		this.#value = Same.copy(value);
		this.#kept = true;
		return same;
	}

	/** Forgets the value kept, so the next `keep` answers false. */
	clear() {
		this.#value = undefined;
		this.#kept = false;
	}

	/** Whether two values are the same: plain data by content, anything else by identity. */
	static equal(a, b) {
		if (Object.is(a, b)) return true;
		if (Array.isArray(a) || Array.isArray(b)) {
			if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
			return a.every((item, index) => Same.equal(item, b[index]));
		}
		if (!Same.#plain(a) || !Same.#plain(b)) return false;
		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) return false;
		return keys.every(key => Object.hasOwn(b, key) && Same.equal(a[key], b[key]));
	}

	/** A copy of the plain data in `value`; what is not plain data is kept as it is. */
	static copy(value) {
		if (Array.isArray(value)) return value.map(item => Same.copy(item));
		if (!Same.#plain(value)) return value;
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Same.copy(item)]));
	}

	static #plain(value) {
		if (value === null || typeof value !== 'object') return false;
		const prototype = Object.getPrototypeOf(value);
		return prototype === Object.prototype || prototype === null;
	}
}
