// The thread page of the React consumers (0.11.0), in Spanish through the components' own `labels.es`:
// the Sidebar with ages and a count; a Page at the thread tier whose header turns compact on scroll and
// whose panel has its own head, Facts and Meters and a wide form; the composer with its state line and
// action, settings chips, attachments and suggestions; since 0.11.1 its Options below 30rem, a product's
// own glyph-only control with `useHint`, and an age said by `Age`; since 0.11.2 `?dock=codex`, a refused
// video and the page's main region as the drop surface.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, Page, PageHeader, PanelToggle, Status, Button, Composer, ChoiceChip, Facts, Meter, Icon, Age, useHint } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, rows, dock, refuses, suggest, paragraphs, minutes } from '../data/thread.js';
import { es } from './labels.js';

const copy = words.es;
const log = [];
const fixture = { log, ready: false };
window.fixture = fixture;
const labels = { sidebar: Sidebar.labels.es, composer: Composer.labels.es, chip: ChoiceChip.labels.es, facts: Facts.labels.es, meter: Meter.labels.es, panel: { hide: 'Ocultar {title}', close: 'Cerrar' } };
let count = 0;
const reset = Date.now() + 3 * 3_600_000;
const stale = Date.now() - 26 * 3_600_000;
const said = new Age({ locale: 'es' }).of(Date.now() - minutes[1] * 60_000);
const turn = dock(copy);

/** A product's own glyph-only control with the family tooltip, and an age in the Sidebar's words. */
function Own() {
	const ref = useHint();
	return (
		<div className="own" id="own" ref={ref}>
			<button type="button" className="bui-icon-button" aria-label={copy.more} data-bui-hint>
				<Icon name="more" />
			</button>
			<time id="age" dateTime={said.datetime}>
				{said.label}
			</time>
		</div>
	);
}

function View() {
	const [items, setItems] = useState([]);
	const [wide, setWide] = useState(shape.wide);
	const surface = useRef(null);
	const latest = useRef(items);
	latest.current = items;
	const change = next => ((latest.current = next), setItems(next));
	const upload = item => {
		change([...latest.current.filter(other => other.key !== item.key), { ...item, state: 'uploading', progress: 0.3 }]);
		setTimeout(() => change(latest.current.map(other => (other.key === item.key ? { ...other, progress: 0.7 } : other))), 60);
		setTimeout(() => change(latest.current.map(other => (other.key === item.key ? (/big/.test(other.name) ? { ...other, state: 'failed', reason: 'Más de 10 MB' } : { ...other, state: 'ready', progress: null }) : other))), 140);
	};
	fixture.attach = change;
	Object.defineProperty(fixture, 'items', { get: () => latest.current, configurable: true });
	const attach = {
		accept: 'image/*,text/plain',
		onFiles: (files, via) => {
			log.push(`files:${via}:${files.map(file => file.name).join(',')}`);
			for (const file of files) {
				const item = { key: `f${(count += 1)}`, name: file.name, size: file.size, type: file.type, file };
				if (refuses(file)) change([...latest.current, { ...item, state: 'refused', reason: copy.refused }]);
				else upload(item);
			}
		},
		zone: surface,
		onRemove: item => (log.push(`remove:${item.name}`), change(latest.current.filter(other => other.key !== item.key))),
		onRetry: item => (log.push(`retry:${item.name}`), upload({ ...item, name: item.name.replace('big', 'small') }))
	};
	const settings = (
		<>
			<ChoiceChip label={copy.model} options={turn.models} value={turn.model} labels={labels.chip} onChange={value => log.push(`model:${value}`)} />
			<ChoiceChip label={copy.autonomy} options={turn.levels} value={turn.level} labels={labels.chip} onChange={value => log.push(`autonomy:${value}`)} />
		</>
	);
	const header = <PageHeader title={copy.title} status={<Status label={copy.status} tone="progress" />} facts={copy.facts} actions={<><Button label={copy.review} variant="quiet" onClick={() => setWide(value => !value)} /><PanelToggle label={copy.details} /></>} compact={{ actions: <Button label={copy.pull} variant="primary" /> }} />;
	const aside = (
		<>
			<Facts head={{ title: copy.changes, value: copy.summary, state: [copy.pushed, 'warning'] }} rows={rows(copy, <Button label={copy.copy} variant="quiet" />)} labels={labels.facts} />
			<Facts head={{ title: copy.engine, value: 'Claude Code · plan Max' }} rows={[{ key: 'model', label: copy.model, value: 'claude-opus-5-5', mono: true }]} />
			<Meter label={copy.window} value={0.86} reset={reset} labels={labels.meter} locale="es" />
			<Meter label={copy.week} value={0.4} stale={stale} labels={labels.meter} locale="es" />
		</>
	);
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} labels={es.family} account={{ signout: () => {} }} />
			<div className="bui-shell">
				<Sidebar product={copy.product} context={{ label: copy.project, name: 'Storefront' }} groups={groups(copy)} action={{ label: copy.action, href: '#/new' }} labels={labels.sidebar} />
				<main id="main" ref={surface}>
					<Page template="detail" width="thread" header={header} aside={aside} label={copy.panel} panel={{ cut: '73rem', title: copy.details, head: true, wide, labels: labels.panel, onChange: shown => log.push(`panel:${shown}`) }}>
						<div className="thread" id="thread">
							<Own />
							<p className="message">También añade una prueba de un pago fallido que conserve el carrito.</p>
							{paragraphs.map(text => (
								<p key={text} className="answer">{text}</p>
							))}
							<div className="narrow" id="narrow">
								<Facts label={copy.changes} rows={rows(copy, <Button label={copy.copy} variant="quiet" />).slice(0, 2)} />
							</div>
						</div>
						<div className="dock">
							<Composer label={copy.message} placeholder={copy.placeholder} labels={labels.composer} locale="es" status={{ text: copy.stopped, action: { label: copy.start, onSelect: () => log.push('start') } }} settings={settings} attach={attach} attachments={items} onSuggest={suggest} suggest={{ bound: 1500 }} compact={shape.compact} summary={turn.summary} actions={turn.actions} stop={turn.stop ? { label: turn.stop, onSelect: () => log.push('interrupt') } : null} onSubmit={message => (log.push(`send:${message.text}:${(message.attachments ?? []).length}`), change([]), Promise.resolve())} />
						</div>
					</Page>
				</main>
			</div>
		</>
	);
}

const root = createRoot(document.getElementById('root'));
root.render(
	<StrictMode>
		<View />
	</StrictMode>
);
fixture.destroy = () => root.unmount();
requestAnimationFrame(() => requestAnimationFrame(() => (fixture.ready = true)));
