/**
 * Which products an adapter answer says could not be reached.
 *
 * Two shapes are read, in a summary and in a list page alike: `unavailable`, a list of product ids
 * (a product's own relay), and `sources`, a list of `{ product, state }` (Beyond Projects), where
 * `state: 'unavailable'` marks a product whose items are hidden because it did not answer. Any
 * other state is not a partial signal. The ids come back once each, in the order first named.
 */
export class Reach {
	/** Product ids whose items are hidden, from `unavailable` and `sources`. */
	static missing(answer) {
		const listed = Array.isArray(answer?.unavailable) ? answer.unavailable : [];
		const sources = Array.isArray(answer?.sources) ? answer.sources.filter(source => source?.state === 'unavailable').map(source => source.product) : [];
		return [...new Set([...listed, ...sources])].filter(id => typeof id === 'string' && id);
	}
}
