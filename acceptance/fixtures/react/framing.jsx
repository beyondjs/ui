// Framed choices (0.46.0) in the React consumers: the DOM page's groups, controlled, with one hint drawn as React
// content. window.fixture holds what the groups reported.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Choices, Button } from '@beyond-js/ui/react';
import { permissions, chosen, reach } from '../data/framing.js';

window.fixture = { changes: [], ready: false };
const options = permissions.map(option => (option.value === 'read' ? { ...option, hint: <span className="fixture-hint">{option.hint}</span> } : option));
function View() {
	const [value, setValue] = useState(chosen);
	const [where, setWhere] = useState('one');
	useLayoutEffect(() => {
		window.fixture.ready = true;
	}, []);
	const report = set => next => (window.fixture.changes.push(next), set(next));
	return (
		<main>
			<Button label="Before the permissions" />
			<div id="permissions"><Choices legend="What it may do" options={options} value={value} framed onChange={report(setValue)} /></div>
			<div id="reach"><Choices legend="Where" type="radio" name="reach" options={reach} value={where} framed onChange={report(setWhere)} /></div>
		</main>
	);
}
createRoot(document.getElementById('root')).render(<StrictMode><View /></StrictMode>);
