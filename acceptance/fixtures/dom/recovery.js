// The 0.24.0 page of the plain DOM consumer (D163): a project's Home whose four reads did not answer on one
// cause, said once by the page's Recovery; each region says it in its own place and one keeps an earlier
// read's content with its time. `?whole=1`: nothing on the page could be read, so the notice is its body;
// `?bare=1`: the reads carry no evidence, so the line has no Technical details (0.44.0).
// window.fixture answers the reads.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { Page, PageHeader, Section, Recovery, RetryAction, AgainLine, TechnicalDetails, EmptyState, LastUpdate, el } from '@beyond-js/ui';
import { words as copy, shape } from '../data/recovery.js';

const { language, whole, bare } = shape();
const words = copy[language];
const spanish = language === 'es';
document.documentElement.lang = language;
const recovery = new Recovery({ title: words.cause, whole, locale: language, labels: spanish ? { ...RetryAction.labels.es, ...AgainLine.labels.es, ...TechnicalDetails.labels.es } : {}, focus: () => document.querySelector('h1') });
const outage = spanish ? { labels: EmptyState.labels.es } : {};
const machines = new Section({ title: words.machines, unavailable: outage });
const work = new Section({ title: words.work, unavailable: outage });
const attention = new Section({ title: words.attention, children: [el('ul', { class: 'recovery-kept' }, words.kept.map(text => el('li', { text })))], updated: { time: Date.now() - 4 * 60_000, locale: language, labels: spanish ? LastUpdate.labels.es : {} } });
const read = { tries: 0, answer: false };
const header = new PageHeader({ title: words.title, facts: words.project });
const main = document.getElementById('root').appendChild(el('main'));
new Page({ template: 'overview', width: 'fluid', header, children: [recovery.element, ...(whole ? [] : [machines.element, work.element, attention.element])] }).mount(main);
const said = Date.now() - 2000;
for (const [key, title] of words.reads)
	recovery.set(key, {
		title,
		details: bare ? null : { request: `req_${key}_7Hq2`, time: said, text: words.said },
		run: async () => {
			read.tries += 1;
			if (!read.answer) return false;
			machines.children = [el('p', { id: 'answered', text: words.answered })];
			return true;
		}
	});
window.fixture = { read, recovery, ready: true };
