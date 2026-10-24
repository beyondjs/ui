// The 0.17.1 page of the React consumers: a FamilyBar whose brand address, account label, entries and
// descriptor change while a menu is open (Delegate's rebuilds after first paint), a CopyValue in a fact's
// narrow value, and an outage that tries again by itself; since 0.31.0 a region that starts waiting for its
// first read on demand. window.fixture drives them.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FamilyBar, CopyValue, Unavailable, Section } from '@beyond-js/ui/react';
import { chosen, fallback, product } from '../data/family.js';

const descriptor = chosen();
const read = { tries: 0, answer: false };

function App() {
	const [round, setRound] = useState(0);
	const [down, setDown] = useState(true);
	const [waiting, setWaiting] = useState(false);
	window.fixture = {
		read,
		redraw: () => setRound(value => value + 1),
		same: () => setRound(value => value),
		wait: () => setWaiting(true),
		ready: true
	};
	const projects = [...descriptor.projects, ...Array.from({ length: round }, (_, index) => ({ id: `prj_${index}`, name: `Project ${index + 1}`, current: false }))];
	return (
		<>
			<FamilyBar product={product} brand={{ src: '../brand/wordmark.svg', href: round ? `/projects/?round=${round}` : '/projects/' }} descriptor={{ ...descriptor, projects }} fallback={fallback} account={{ label: round ? `Account ${round}` : 'Account', signout: () => {}, items: [{ label: 'Settings', href: `/settings/${round}` }] }} />
			<main className="hold-page">
				<div className="hold-fact" id="fact">
					<CopyValue value="snap_01HZX9K3M4N5P6Q7R8S9T0V1W2" label="the identifier" />
				</div>
				{down ? (
					<Unavailable
						title="Snapshots is not answering"
						reason="Your snapshots are safe. This page opens by itself when it answers."
						kind="outage"
						again={async () => {
							read.tries += 1;
							if (!read.answer) throw new Error('unavailable');
							setDown(false);
						}}
					/>
				) : (
					<p id="recovered">Your snapshots</p>
				)}
				{waiting ? <Section title="Recent" waiting={{ rows: 2 }} /> : null}
			</main>
		</>
	);
}

createRoot(document.getElementById('root')).render(<App />);
