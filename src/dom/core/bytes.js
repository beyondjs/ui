/**
 * A size said in the person's language (0.11.2): "300 B" below a thousand bytes (the unit `Intl` says
 * as "300 byte"), then "12 kB", "1.2 MB", "3.4 GB" in decimal units. Shared by the composer's
 * attachments and by a product's own lines (a sent message's files), so one size reads the same
 * everywhere. `bytes` is the small unit's words (`{count} B`).
 */
export class Bytes {
	static #units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];

	#locale;
	#small;

	/** @param {{locale?: string, bytes?: string}} [options] the language, and the small unit's words with `{count}` */
	constructor({ locale = undefined, bytes = '{count} B' } = {}) {
		this.#locale = locale;
		this.#small = bytes;
	}

	/** The size of `count` bytes in words, or null when it is not a number. */
	of(count) {
		if (!Number.isFinite(count)) return null;
		if (count < 1000) return this.#small.replace('{count}', new Intl.NumberFormat(this.#locale).format(Math.max(0, Math.round(count))));
		let value = count;
		let unit = 0;
		while (value >= 1000 && unit < Bytes.#units.length - 1) {
			value /= 1000;
			unit += 1;
		}
		return new Intl.NumberFormat(this.#locale, { style: 'unit', unit: Bytes.#units[unit], unitDisplay: 'short', maximumFractionDigits: unit < 2 ? 0 : 1 }).format(value);
	}
}
