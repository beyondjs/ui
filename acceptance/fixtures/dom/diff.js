// The diff page of the plain DOM consumer (0.11.2), in English: one Diff of the patch named by `?patch=`
// (`main` by default, `many` for twelve files). window.fixture holds the diff and a teardown.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Diff } from '@beyond-js/ui';
import { patches } from '../data/diff.js';

const name = new URLSearchParams(location.search).get('patch') ?? 'main';
const diff = new Diff({ patch: patches[name] ?? '', label: 'Changes of the conversation' }).mount(document.getElementById('main'));
window.fixture = { diff, ready: true, destroy: () => diff.destroy() };
