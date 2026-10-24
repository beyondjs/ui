// The round page of the React consumers (0.14.0): the thread template's dock with the Composer and the
// Sidebar's objects, as the DOM page has them, for the dock's distance and the sidebar's parity.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { createRoot } from 'react-dom/client';
import { Sidebar, Page, PageHeader, Composer } from '@beyond-js/ui/react';
import { groups, turns, commands } from '../data/round.js';

const log = [];
window.fixture = { log, ready: false };
function Round() {
	return (
		<div className="bui-shell">
			<Sidebar product="Conduict" context={{ label: 'Project', name: 'Storefront' }} groups={groups()} shortcut />
			<main id="main">
				<Page template="thread" header={<PageHeader title="Fix the checkout redirect" />} dock={<Composer label="Message to Claude Code" commands={commands(log)} recall={() => 'Also add a test'} tray={<button type="button" className="bui-button bui-button-secondary">web · Ready</button>} onSubmit={message => log.push(`send:${message.text}`)} />}>
					<div className="thread" id="thread">
						{turns().map((turn, index) => (turn.kind === 'code' ? <pre key={index} className="code bui-lane-wide">{turn.text}</pre> : <p key={index} className={turn.kind === 'message' ? 'message' : 'answer'}>{turn.text}</p>))}
					</div>
				</Page>
			</main>
		</div>
	);
}
// This page draws no family bar: the chrome above the page is only the sidebar's row below its cut
document.documentElement.style.setProperty('--layout-family', '0px');
createRoot(document.getElementById('root')).render(<Round />);
requestAnimationFrame(() => requestAnimationFrame(() => (window.fixture.ready = true)));
