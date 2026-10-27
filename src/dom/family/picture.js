import { el } from '../core/element.js';

/**
 * A picture the family bar lays over a placeholder of initials: a person's avatar (D81) or an
 * organization's logo (D195, 0.40.0).
 *
 * The picture is laid over once it loads, and one that fails (an address the product's content policy
 * refuses, a picture gone at its provider) is removed, so the initials always remain. It is requested
 * without a referrer, so the provider never learns which product asked.
 */
export class Picture {
	/**
	 * The address when it is one the bar shows: `https:`, an image as `data:`, or `http:` on a loopback
	 * host (`localhost`, a `.localhost` name, `127.0.0.1`, `[::1]`), which browsers treat as secure and
	 * where local development serves pictures, such as Accounts' logos on `accounts.beyond.localhost`.
	 */
	static source(address) {
		if (typeof address !== 'string' || !address) return null;
		if (/^data:image\//i.test(address)) return address;
		try {
			const { protocol, hostname } = new URL(address);
			if (protocol === 'https:') return address;
			return protocol === 'http:' && Picture.#loopback(hostname) ? address : null;
		} catch {
			return null;
		}
	}

	static #loopback(hostname) {
		return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1' || hostname === '[::1]';
	}

	/** Lays the picture at `address` over `holder`; nothing when the bar does not show that address. */
	static lay(holder, address) {
		const source = Picture.source(address);
		if (!source) return;
		const image = el('img', { class: 'bui-family-picture', alt: '', src: source, referrerpolicy: 'no-referrer', decoding: 'async' });
		image.addEventListener('load', () => holder.setAttribute('data-picture', ''), { once: true });
		image.addEventListener('error', () => image.remove(), { once: true });
		holder.append(image);
	}
}
