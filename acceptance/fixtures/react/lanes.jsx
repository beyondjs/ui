// The lanes page of the React consumers, in Spanish (0.27.0): the same crew as the DOM page through the
// React Lanes with Lanes.labels.es, a box under 40rem and every state once; choosing a lane makes it
// current. window.fixture moves the clock, changes a live line, appends a lane and ends the crew.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Lanes, Clock, Button } from '@beyond-js/ui/react';
import { start, crew, late, states } from '../data/lanes.js';

let now = start + 102_000;
const clock = new Clock({ now: () => now });
const labels = Lanes.labels.es;
const chosen = [];
let change = () => undefined;

function Page() {
	const [lanes, setLanes] = useState(() => crew('es'));
	const [current, setCurrent] = useState(null);
	change = setLanes;
	const given = lanes.map(lane => ({ ...lane, current: lane.key === current }));
	const choose = key => {
		chosen.push(key);
		setCurrent(key);
	};
	return (
		<main>
			<h1>Carriles</h1>
			<Button label="Antes de los carriles" />
			<section className="fixture-wide">
				<Lanes label="Subagentes de este turno" lanes={given} clock={clock} locale="es" labels={labels} onChoose={choose} />
			</section>
			<section className="fixture-narrow">
				<Lanes label="Subagentes en una caja estrecha" lanes={given} clock={clock} locale="es" labels={labels} onChoose={choose} />
			</section>
			<section className="fixture-marks">
				<Lanes label="Cada estado" lanes={states} clock={clock} locale="es" labels={labels} trace={false} />
			</section>
		</main>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = {
	start,
	chosen,
	at: elapsed => {
		now = start + elapsed;
		clock.tick();
	},
	say: text => change(lanes => lanes.map(lane => (lane.key === 'plan' ? { ...lane, now: text } : lane))),
	add: () => change(lanes => [...lanes, late('es')]),
	end: () => change(lanes => lanes.map(lane => (lane.state === 'running' || lane.state === 'waiting' ? { ...lane, state: 'done', until: now } : lane))),
	destroy: () => root.unmount(),
	ready: false
};
root.render(
	<StrictMode>
		<Page />
	</StrictMode>
);
window.fixture.ready = true;
