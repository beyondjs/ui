// The tools page's records (0.44.0): usage of a few projects over two months, read on a fixed clock so the
// periods a chooser offers are the same on every run, in English and Spanish. `?empty=1` reads nothing.
import { Period } from '@beyond-js/ui';

/** 27 October 2026, 15:30 UTC */
export const clock = () => new Date(Date.UTC(2026, 9, 27, 15, 30));
export const shape = { empty: new URLSearchParams(location.search).get('empty') === '1' };

export const usage = [
	{ id: 'atlas', name: 'Atlas storefront', kind: 'widget', at: '2026-10-21T10:00:00Z', amount: '12.40' },
	{ id: 'cedar', name: 'Cedar billing service with a long name', kind: 'service', at: '2026-09-14T09:00:00Z', amount: '3.10' },
	{ id: 'birch', name: 'Birch docs', kind: 'widget', at: '2026-09-02T18:00:00Z', amount: '0.80' },
	{ id: 'elm', name: 'Elm workers', kind: 'service', at: '2026-10-02T08:00:00Z', amount: '7.25' }
];

/** The records the tools' state keeps: its period's range and its kind */
export function chosen(state) {
	if (shape.empty) return [];
	const range = Period.range(state.filters?.period, { now: clock() });
	return usage.filter(row => (!range || (Date.parse(row.at) >= range.start.getTime() && Date.parse(row.at) < range.end.getTime())) && (!state.filters?.kind || row.kind === state.filters.kind) && (!state.query || row.name.toLowerCase().includes(state.query.toLowerCase())));
}

export const words = {
	en: { title: 'Usage', period: 'Period', kind: 'Kind', kinds: [{ value: 'widget', label: 'Widgets' }, { value: 'service', label: 'Services' }], graph: 'By project', table: 'Records', empty: 'No usage yet', body: 'Usage appears once a project runs.', register: 'Register application' },
	es: { title: 'Uso', period: 'Periodo', kind: 'Tipo', kinds: [{ value: 'widget', label: 'Widgets' }, { value: 'service', label: 'Servicios' }], graph: 'Por proyecto', table: 'Registros', empty: 'Todavía no hay uso', body: 'El uso aparece cuando un proyecto se ejecuta.', register: 'Registrar aplicación' }
};
