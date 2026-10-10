import { readFile } from 'node:fs/promises';

/* A block comment
   across two lines */
export async function load(path, { retries = 3 } = {}) {
	const options = { encoding: 'utf8', limit: 0x1F_FF, big: 10n, rate: 1.5e-3 };
	const pattern = /^[a-z/]+\.js$/i;
	const half = retries / 2; // division, not a pattern
	const message = `Loading ${path}
on two lines`;
	if (value === undefined || value === null) return NaN;
	return await readFile(path, options.encoding).then(text => text.length > 0 && pattern.test(path) ? text : false);
}
