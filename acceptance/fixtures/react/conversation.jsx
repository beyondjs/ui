// The conversation page of the React consumers, in Spanish through the components' own `labels.es`:
// the Sidebar with entries, a search and "Nueva conversación"; a Page whose panel is kept in view with a
// PanelToggle; activity rows and a group, a plan without a region of its own, a live answer, the
// conversation's composer in a sticky dock and a new conversation's composer with its tools.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, Sidebar, Page, PageHeader, PanelToggle, Section, Status, Composer, LiveText, ActivityRow, ActivityGroup, Steps, ChoiceMenu } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';
import { shape, words, groups, search, output, plan, answer } from '../data/conversation.js';
import { es } from './labels.js';

const copy = words.es;
const log = [];
const fixture = { log, refuse: false, delay: 80, draws: 0, ready: false };
window.fixture = fixture;
const send = message => {
	log.push(`send:${message.action}:${message.text}`);
	return new Promise((resolve, reject) => setTimeout(() => (fixture.refuse ? reject(new Error('refused')) : resolve()), fixture.delay));
};
const sidebarLabels = Sidebar.labels.es;
const composerLabels = Composer.labels.es;
const activityLabels = ActivityRow.labels.es;
const stepsLabels = Steps.labels.es;
const liveLabels = LiveText.labels.es;
const reads = ['src/checkout/redirect.js', 'src/checkout/session.js', 'test/checkout.test.js'].map((path, index) => ({ key: `r${index}`, glyph: 'file', title: `Leyó ${path}` }));

function View() {
	const live = useRef(null);
	const [sections, setSections] = useState(() => groups(copy));
	const [environment, setEnvironment] = useState('web');
	const [blocked, setBlocked] = useState(null);
	fixture.live = live;
	fixture.block = setBlocked;
	fixture.update = () => {
		const next = groups(copy);
		next[3].items = [{ key: 'c6', label: 'Check the logs', href: '#/conversations/c6' }, { ...next[3].items[0], mark: { label: 'Trabajando', tone: 'progress' } }, ...next[3].items.slice(1)];
		setSections(next);
	};
	const header = <PageHeader title={copy.title} status={<Status label={copy.status} tone="warning" />} facts={copy.facts} actions={<PanelToggle label={copy.details} />} />;
	const facts = [copy.environment, copy.engine, copy.repository].map((title, index) => (
		<Section key={title} title={title} level={3}>
			<p className="facts">{['web · En marcha · 4 vCPU', 'Claude Code · plan Max', 'acme/web desde main'][index]}</p>
			{index === 0 ? <a href="#/environments/web">Abrir web</a> : null}
		</Section>
	));
	const tools = (
		<>
			<ChoiceMenu label={copy.environment} options={[{ value: 'web', label: 'web', status: ['Detenido', 'neutral'] }, { value: 'lab', label: 'lab' }]} value={environment} onChange={setEnvironment} labels={ChoiceMenu.labels.es} />
			<ChoiceMenu label={copy.engine} options={[{ value: 'claude', label: 'Claude Code' }, { value: 'codex', label: 'Codex' }]} value="claude" labels={ChoiceMenu.labels.es} />
		</>
	);
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: '/projects/' }} descriptor={chosen()} fallback={fallback} labels={es.family} account={{ signout: () => {} }} />
			<div className="bui-shell">
				<Sidebar product={copy.product} section={copy.section} context={{ label: copy.project, name: 'Storefront' }} groups={sections} action={{ label: copy.action, href: '#/new' }} search={search(copy)} labels={sidebarLabels} onNavigate={item => log.push(`navigate:${item.href}`)} />
				<main id="main">
					<Page template="detail" width="standard" header={header} aside={facts} label={copy.panel} panel={{ cut: '73rem', open: shape.panel, title: copy.details, onChange: shown => log.push(`panel:${shown}`), labels: { close: 'Cerrar' } }}>
						<section className="fresh" id="fresh">
							<Composer label={copy.message} placeholder="Mensaje para Claude Code…" status={copy.state} tools={tools} disabled={blocked ? { reason: blocked } : null} actions={[{ id: 'start', label: copy.start, primary: true }, { id: 'wait', label: copy.wait }]} onSubmit={send} labels={composerLabels} />
						</section>
						<div className="thread">
							<p className="message">Añade también una prueba de un pago fallido que conserve el carrito y luego confírmala.</p>
							<ActivityGroup glyph="file" title={copy.read} rows={reads} labels={activityLabels} />
							<ActivityRow glyph="code" title="Editó src/checkout/redirect.js" meta="+1 −1" duration={900} body={[{ label: 'Diferencias', text: '- return session.cart\n+ return order.confirmation' }]} labels={activityLabels} />
							<ActivityRow glyph="terminal" title="Ejecutó npm test" meta="salida 1" state="failed" duration={12_400} body={() => <pre className="bui-activity-code">{output}</pre>} labels={activityLabels} />
							<ActivityRow glyph="terminal" title="Ejecutando npm test -- --reporter=spec test/checkout/failed-payment.test.js test/checkout/redirect.test.js" state={shape.running ? 'running' : 'done'} since={Date.now() - 4000} tail={'ok 1 - conserva el carrito\nok 2 - muestra el error'} body={[{ label: 'Entrada', text: 'npm test -- --reporter=spec' }]} labels={activityLabels} />
							<Steps label={copy.plan} steps={plan(['Leer el pago', 'Escribir la prueba que falla', 'Confirmar'])} announce={false} labels={stepsLabels} />
							<LiveText ref={live} labels={liveLabels} render={text => <Drawn text={text} />} />
						</div>
						<div className="dock">
							<Composer label={copy.message} placeholder={copy.placeholder} actions={[{ id: 'queue', label: copy.queue }]} stop={shape.running ? { label: copy.interrupt, onSelect: () => new Promise(resolve => setTimeout(() => (log.push('interrupt'), resolve()), 800)) } : null} onSubmit={send} labels={composerLabels} />
						</div>
					</Page>
				</main>
			</div>
		</>
	);
}

/** The live answer's paragraphs; each commit of a new text counts as one drawing (StrictMode renders twice, commits once). */
function Drawn({ text }) {
	useLayoutEffect(() => void (fixture.draws += 1), [text]);
	return text.split('\n\n').map((part, index) => <p key={index}>{part}</p>);
}

/** Streams the answer through the ref in pieces of `size` characters every `every` ms; resolves with the frames that passed. */
fixture.stream = (size = 3, every = 2) =>
	new Promise(resolve => {
		let frames = 0;
		let at = 0;
		const count = () => ((frames += 1), at < answer.length && requestAnimationFrame(count));
		requestAnimationFrame(count);
		const timer = setInterval(() => {
			fixture.live.current.append(answer.slice(at, at + size));
			at += size;
			if (at >= answer.length) {
				clearInterval(timer);
				requestAnimationFrame(() => requestAnimationFrame(() => resolve(frames)));
			}
		}, every);
	});
const root = createRoot(document.getElementById('root'));
fixture.destroy = () => root.unmount();
root.render(
	<StrictMode>
		<View />
	</StrictMode>
);
fixture.ready = true;
