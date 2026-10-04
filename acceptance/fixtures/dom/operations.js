// The long-operation page of the plain DOM consumer, in English: the awaited card with its steps, a
// state with its freshness, technical details, selects whose chosen text may be cut, and a family bar
// whose sign-out goes to Accounts' /leave on this origin. The clock reads `?at=<minutes>` since the
// operation began; window.fixture.at(minutes) moves it, and window.fixture.release() answers a check.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Awaited, Clock, FamilyBar, Freshness, Select, TechnicalDetails, el } from '@beyond-js/ui';
import { descriptors } from '../data/family.js';
import { start, minute, minutes, at, expected, steps, reason, signout } from '../data/operations.js';

let now = start + minutes * minute;
const clock = new Clock({ now: () => now });
const log = [];
const root = document.getElementById('root');
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));
const forms = {
	leave: { end: async () => (await wait(300), log.push('end')) },
	cancel: { before: () => (log.push('before'), false), end: () => log.push('end') },
	silent: { end: () => new Promise(() => log.push('end')), bound: 400 }
};
const bar = new FamilyBar({
	product: 'delegate',
	brand: { src: '../brand/wordmark.svg', href: '/projects/' },
	descriptor: { ...descriptors.long, links: { ...descriptors.long.links, leave: `${location.origin}/fixtures/leave.html` } },
	account: { signout: forms[signout] }
}).mount(root);

let answer = null;
const card = new Awaited({
	title: 'Starting My first VM',
	since: at(0),
	expected,
	steps,
	clock,
	check: () => (log.push('check'), new Promise(resolve => (answer = resolve))),
	onend: outcome => log.push(`end:${outcome}`)
});
const live = new Freshness({ label: 'Running', tone: 'success', checked: at(0), clock });
const lost = new Freshness({ label: 'Running', tone: 'success', checked: at(0), connected: false, clock });
const details = new TechnicalDetails({ text: 'dial tcp 203.0.113.7:443: i/o timeout', request: 'req_7Hq2', time: at(3) });
const names = [{ value: 'long', label: 'Storefront redesign for the spring catalogue' }, { value: 'short', label: 'Lab' }];
const long = new Select({ options: names, value: 'long', id: 'long' });
const short = new Select({ options: names, value: 'short', id: 'short' });
long.control.setAttribute('aria-label', 'Project');
short.control.setAttribute('aria-label', 'Environment');
const main = el('main', { class: 'operations' }, [el('h1', { text: 'Long operations' }), card.element, el('p', { id: 'live' }, [live.element]), el('p', { id: 'lost' }, [lost.element]), details.element, el('div', { class: 'narrow' }, [long.element]), el('div', { class: 'narrow' }, [short.element])]);
root.append(main);

window.fixture = {
	log,
	card,
	at(value) {
		now = start + value * minute;
		clock.tick();
	},
	/** Answers the pending check: the machine cannot be reached. */
	release() {
		card.update({ reason });
		answer?.();
	},
	end: outcome => card.end(outcome),
	destroy() {
		for (const component of [bar, card, live, lost, details, long, short]) component.destroy();
		root.replaceChildren();
	},
	ready: true
};
