/**
 * Branches of a repository, as Projects' `GET /v1/repositories/{rep}/branches` lists them: more than
 * `ChoiceMenu.threshold`, with segments a search matches (`feature/…`, `fix/…`) and a name with
 * accents. `refs()` gives the `RefChooser` shape with `main` as the default.
 */
export const branches = [
	'develop',
	'feature/billing',
	'feature/login-page',
	'feature/search',
	'fix/login-redirect',
	'fix/typo',
	'gh-pages',
	'main',
	'release/2026.10',
	'release/ñandú',
	'renovate/react-19',
	'spike/agents',
	'staging',
	'topic/a',
	'topic/b',
	'topic/c',
	'wip'
];

export const refs = () => branches.map(name => ({ name, ...(name === 'main' ? { default: true } : {}) }));
