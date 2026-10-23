// The lanes page of the plain DOM consumer (0.22.0): a crew of subagents as one block of Lanes on an
// injected clock, the same crew in a box under 40rem (its two-line form at any window width), and every
// state once. Choosing a lane makes it current, as a product opening its detail would. window.fixture
// moves the clock, changes a live line, appends a lane, ends the crew and records what was chosen.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Lanes, Clock, Button, el } from '@beyond-js/ui';
import { start, crew, late, states } from '../data/lanes.js';

let now = start + 102_000;
let lanes = crew('en');
let current = null;
const chosen = [];
const clock = new Clock({ now: () => now });
const draw = () => {
	const given = lanes.map(lane => ({ ...lane, current: lane.key === current }));
	wide.update({ lanes: given });
	narrow.update({ lanes: given });
};
const choose = key => {
	chosen.push(key);
	current = key;
	draw();
};
const wide = new Lanes({ label: 'Subagents of this turn', clock, locale: 'en', choose });
const narrow = new Lanes({ label: 'Subagents in a narrow box', clock, locale: 'en', choose });
const marks = new Lanes({ label: 'Every state', clock, locale: 'en', trace: false });
draw();
marks.update({ lanes: states });
document.getElementById('root').append(
	el('main', {}, [el('h1', { text: 'Lanes' }), new Button({ label: 'Before the lanes' }).element, el('section', { class: 'fixture-wide' }, [wide.element]), el('section', { class: 'fixture-narrow' }, [narrow.element]), el('section', { class: 'fixture-marks' }, [marks.element])])
);
window.fixture = {
	start,
	chosen,
	at: elapsed => {
		now = start + elapsed;
		clock.tick();
	},
	say: text => {
		lanes = lanes.map(lane => (lane.key === 'plan' ? { ...lane, now: text } : lane));
		draw();
	},
	add: () => {
		lanes = [...lanes, late('en')];
		draw();
	},
	end: () => {
		lanes = lanes.map(lane => (lane.state === 'running' || lane.state === 'waiting' ? { ...lane, state: 'done', until: now } : lane));
		draw();
	},
	destroy: () => [wide, narrow, marks].forEach(block => block.destroy()),
	ready: true
};
