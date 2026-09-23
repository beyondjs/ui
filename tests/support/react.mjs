import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * Loaded with `--import` to run a test file on another React: every `react` and `react-dom`
 * specifier, from the tests and from this package's sources alike, resolves from the project named
 * by `BUI_REACT_DIRECTORY` (a temporary installation made by `tests/react18.test.mjs`).
 */
const directory = process.env.BUI_REACT_DIRECTORY;
if (!directory) throw new Error('BUI_REACT_DIRECTORY names no React installation');
const parent = pathToFileURL(`${directory}/`).href;
const react = /^react(-dom)?(\/|$)/;

registerHooks({
	resolve(specifier, context, next) {
		return react.test(specifier) ? next(specifier, { ...context, parentURL: parent }) : next(specifier, context);
	}
});
