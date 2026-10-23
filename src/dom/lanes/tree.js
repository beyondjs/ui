/**
 * Where a nested lane hangs from (0.27.0): for each lane of the given order, its depth (0 to 3), whether
 * a sibling follows it at its depth (`middle`, drawn ├) or not (`last`, drawn └), and which shallower
 * levels continue past it to a later sibling (drawn │). The order is the product's and is never changed;
 * a depth outside 0 to 3 is drawn at the nearest one (the product counts deeper work on its parent).
 * Stateless reading of the order: the standard's exception for pure functions, kept as static members.
 */
export class LaneTree {
	/** The deepest level drawn. */
	static deepest = 3;

	/** A depth the lanes draw: a whole number from 0 to 3. */
	static depth(value) {
		const depth = Math.trunc(Number(value));
		return Number.isFinite(depth) ? Math.min(Math.max(depth, 0), LaneTree.deepest) : 0;
	}

	/**
	 * The branch of every lane: `{ depth, branch, through }`, `branch` null at depth 0.
	 *
	 * @param {number[]} depths the lanes' depths in their order
	 */
	static of(depths) {
		return depths.map((depth, index) => {
			if (!depth) return { depth, branch: null, through: [] };
			const through = [];
			for (let level = 1; level < depth; level += 1) if (LaneTree.#follows(depths, index, level)) through.push(level);
			return { depth, branch: LaneTree.#follows(depths, index, depth) ? 'middle' : 'last', through };
		});
	}

	/** Whether a lane at `level` comes after `index` before the order climbs above that level. */
	static #follows(depths, index, level) {
		for (let next = index + 1; next < depths.length; next += 1) {
			if (depths[next] < level) return false;
			if (depths[next] === level) return true;
		}
		return false;
	}
}
