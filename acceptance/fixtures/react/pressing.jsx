// The pressing page of the React consumers (0.34.0, D183), in Spanish: the DOM page's composer through the
// adapter (a branch chip that waits for the repository chip, a held Send whose press goes to it and the line
// comments in the tray), and an invitation in React's `Form` with `report`, whose email the browser checks.
// window.fixture logs what runs.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageHeader, Composer, ComposerChip, ChoiceChip, Form, Button } from '@beyond-js/ui/react';
import { words } from '../data/pressing.js';

const copy = words.es;
const log = [];
const warnings = [];
const warn = console.warn.bind(console);
console.warn = (message, ...rest) => (warnings.push(String(message)), warn(message, ...rest));
window.fixture = { log, warnings, ready: false };
const labels = { composer: Composer.labels.es, choice: ChoiceChip.labels.es };

function Pressing() {
	const [chosen, setChosen] = useState(null);
	const holder = useRef(null);
	// The repository chip's button: where a press on the waiting branch or the held Send puts the person
	const place = () => holder.current?.querySelector('.bui-chip .bui-choice-button') ?? null;
	const choose = value => (log.push(`repository:${value}`), setChosen(value));
	const tray = (
		<span ref={holder} className="pressing-tray">
			<ChoiceChip label={copy.repository} options={copy.repositories} value={chosen} onChange={choose} labels={labels.choice} />
			<ChoiceChip label={copy.branch} options={copy.branches} waiting={!chosen} place={place} onChange={value => log.push(`branch:${value}`)} labels={labels.choice} />
			<ComposerChip label={copy.comments} value={2} glyph="chat" name={copy.said(2)} onClick={() => log.push('comments:open')} />
		</span>
	);
	const composer = <Composer label={copy.label} placeholder={copy.placeholder} value={copy.draft} tray={tray} disabled={chosen ? null : { reason: copy.held, place }} labels={labels.composer} onSubmit={message => log.push(`send:${message.text}`)} />;
	return (
		<main id="main">
			<Page template="thread" header={<PageHeader title={copy.title} />} dock={composer}>
				<Form id="invite" className="pressing-invite" report onSubmit={event => (event.preventDefault(), log.push(`form:submit:${new FormData(event.currentTarget).get('email')}`))}>
					<input name="name" required aria-label={copy.invite.name} />
					<input name="email" type="email" aria-label={copy.invite.email} />
					<Button label={copy.invite.send} type="submit" variant="primary" />
				</Form>
			</Page>
		</main>
	);
}

createRoot(document.getElementById('root')).render(<Pressing />);
requestAnimationFrame(() => requestAnimationFrame(() => (window.fixture.ready = true)));
