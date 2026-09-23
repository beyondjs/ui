/**
 * Records every method or property setter that runs on a destroyed instance of the given DOM
 * component classes (`destroy()` itself excepted), so a test can prove an adapter never works
 * through an instance it already destroyed. The classes stay wrapped for the test file's process.
 */
export class Touches {
	#list = [];

	/** @param {Function[]} classes DOM component classes to watch */
	constructor(classes) {
		for (const type of classes) this.#watch(type);
	}

	/** `Class.member` for each call on a destroyed instance, in order. */
	get list() {
		return [...this.#list];
	}

	clear() {
		this.#list = [];
	}

	#watch(type) {
		const list = () => this.#list;
		for (let prototype = type.prototype; prototype && prototype !== Object.prototype; prototype = Object.getPrototypeOf(prototype)) {
			for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(prototype))) {
				if (name === 'constructor' || name === 'destroy' || !descriptor.configurable) continue;
				const label = `${type.name}.${name}`;
				if (typeof descriptor.value === 'function') {
					const method = descriptor.value;
					if (method.touches) continue;
					const wrapped = function (...values) {
						if (this.destroyed) list().push(label);
						return method.apply(this, values);
					};
					wrapped.touches = true;
					Object.defineProperty(prototype, name, { ...descriptor, value: wrapped });
				} else if (descriptor.set && !descriptor.set.touches) {
					const setter = descriptor.set;
					const wrapped = function (value) {
						if (this.destroyed) list().push(`${label}=`);
						setter.call(this, value);
					};
					wrapped.touches = true;
					Object.defineProperty(prototype, name, { ...descriptor, set: wrapped });
				}
			}
		}
	}
}
