// The turns page of the React consumers (0.29.0): the thread, its index and the compact line's subject
// as the DOM page has them, in Spanish through the components' own `labels.es`.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, Page, PageHeader, Composer, TurnIndex } from '@beyond-js/ui/react';
import { copy, turns } from '../data/turns.js';

const words = copy('es');
const log = [];
window.fixture = { log, ready: false };
const list = turns('es');
const entries = [{ label: 'Mencionar un archivo', run: () => log.push('mention') }];

function Turns() {
	const elements = useRef(new Map());
	const heads = useRef(new Map());
	const [placed, setPlaced] = useState(false);
	const [subject, setSubject] = useState(null);
	const [files, setFiles] = useState([]);
	useLayoutEffect(() => setPlaced(true), []);
	// A ready file, as one the product has finished uploading (its files wait for words, 0.32.0)
	window.fixture.attach = () => setFiles([{ key: 'f1', name: 'trace.png', size: 2048, type: 'image/png', state: 'ready' }]);
	const given = useMemo(() => (placed ? list.map(turn => ({ ...turn, title: turn.message, element: elements.current.get(turn.key), head: heads.current.get(turn.key) })) : []), [placed]);
	const view = ({ key, covered }) => {
		log.push(`view:${key}:${covered}`);
		const turn = list.find(each => each.key === key);
		setSubject(covered && turn ? { text: turn.message, href: turn.href } : null);
	};
	return (
		<div className="bui-shell">
			<Sidebar product="Conduict" context={{ label: 'Proyecto', name: 'Storefront' }} groups={[{ items: [{ key: 'home', label: 'Inicio', href: '#home', glyph: 'home' }] }]} />
			<main id="main">
				<Page template="thread" lane="center" header={<PageHeader title={words.title} compact subject={subject} />} dock={<Composer label={words.label} placeholder={words.placeholder} labels={Composer.labels.es} add={entries} attach={{ onFiles: () => undefined, onRemove: () => setFiles([]), words: words.attach }} attachments={files} onSubmit={message => log.push(`send:${message.text}`)} />}>
					<TurnIndex turns={given} labels={TurnIndex.labels.es} onView={view} />
					<ol className="fixture-turns" aria-label={words.turns}>
						{list.map(turn => (
							<li key={turn.key} className="fixture-turn" id={`turn=${turn.key}`} ref={node => elements.current.set(turn.key, node)}>
								<div className="fixture-message" ref={node => heads.current.set(turn.key, node)}>
									{turn.message}
								</div>
								<div className="fixture-answer">
									{turn.answer.split('. ').map((sentence, index) => (
										<p key={index}>{sentence}</p>
									))}
								</div>
							</li>
						))}
					</ol>
				</Page>
			</main>
		</div>
	);
}
// This page draws no family bar: the chrome above the page is only the sidebar's row below its cut
document.documentElement.style.setProperty('--layout-family', '0px');
createRoot(document.getElementById('root')).render(<Turns />);
requestAnimationFrame(() => requestAnimationFrame(() => (window.fixture.ready = true)));
