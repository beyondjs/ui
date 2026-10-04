// The long-operation page of the React consumers, in Spanish through the components' own Spanish
// copy: the awaited card with its steps, freshness, technical details, selects whose chosen text may
// be cut, and a family bar whose sign-out goes to /leave on this origin. The clock reads `?at=`.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Awaited, Clock, FamilyBar, Freshness, Select, Steps, TechnicalDetails } from '@beyond-js/ui/react';
import { descriptors } from '../data/family.js';
import { start, minute, minutes, at, expected, steps, reason, signout } from '../data/operations.js';
import { es } from './labels.js';

let now = start + minutes * minute;
const clock = new Clock({ now: () => now });
const log = [];
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));
const forms = {
	leave: { end: async () => (await wait(300), log.push('end')) },
	cancel: { before: () => (log.push('before'), false), end: () => log.push('end') },
	silent: { end: () => new Promise(() => log.push('end')), bound: 400 }
};
const descriptor = { ...descriptors.long, links: { ...descriptors.long.links, leave: `${location.origin}/fixtures/leave.html` } };
const labels = { ...Awaited.labels.es, steps: Steps.labels.es, details: TechnicalDetails.labels.es };
const names = [{ value: 'long', label: 'Storefront redesign for the spring catalogue' }, { value: 'short', label: 'Lab' }];

function Page() {
	const [found, setFound] = useState(null);
	const [ended, setEnded] = useState(null);
	window.fixture.end = setEnded;
	const check = () => (log.push('check'), new Promise(resolve => (window.fixture.release = () => (setFound(reason), resolve()))));
	return (
		<>
			<FamilyBar product="delegate" brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={descriptor} labels={es.family} account={{ signout: forms[signout] }} />
			<main className="operations">
				<h1>Operaciones largas</h1>
				<Awaited title="Iniciando My first VM" since={at(0)} expected={expected} steps={steps} clock={clock} reason={found} check={check} ended={ended} onEnd={outcome => log.push(`end:${outcome}`)} labels={labels} />
				<p id="live"><Freshness label="En marcha" tone="success" checked={at(0)} clock={clock} labels={Freshness.labels.es} /></p>
				<p id="lost"><Freshness label="En marcha" tone="success" checked={at(0)} connected={false} clock={clock} labels={Freshness.labels.es} /></p>
				<TechnicalDetails text="dial tcp 203.0.113.7:443: i/o timeout" request="req_7Hq2" time={at(3)} labels={TechnicalDetails.labels.es} />
				<div className="narrow"><Select id="long" aria-label="Proyecto" options={names} defaultValue="long" /></div>
				<div className="narrow"><Select id="short" aria-label="Entorno" options={names} defaultValue="short" /></div>
			</main>
		</>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = {
	log,
	at(value) {
		now = start + value * minute;
		clock.tick();
	},
	destroy: () => root.unmount(),
	ready: false
};
root.render(<StrictMode><Page /></StrictMode>);
window.fixture.ready = true;
