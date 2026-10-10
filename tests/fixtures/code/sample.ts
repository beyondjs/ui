interface Options {
	readonly name: string;
	count?: number;
}

export type Mode = 'auto' | 'all';

export abstract class Store<T> implements Iterable<T> {
	private items: T[] = [];
	constructor(public label: string, mode: Mode = 'auto') {}
	keys(): keyof Options[] { return [] as unknown as keyof Options[]; }
}
