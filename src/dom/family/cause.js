import { names } from './labels.js';

/** The products the family's catalog of causes names with "Beyond" before their name. */
const branded = Object.freeze(['accounts', 'projects', 'cdn', 'snapshots', 'delegate']);

/**
 * Who did not answer, by its name in the family's catalog of causes (0.33.0): "Beyond Accounts", "Beyond
 * Projects", "Beyond CDN", "Beyond Snapshots" and "Beyond Delegate", and every other product as the
 * family bar names it ("Conduict", "Beyond Home"). A name that is no product id is said as given.
 */
export class CauseName {
	/** The name for a product id such as `projects`, or the given name. */
	static of(source) {
		const id = String(source ?? '');
		if (branded.includes(id)) return `Beyond ${names[id]}`;
		return names[id] ?? id;
	}
}
