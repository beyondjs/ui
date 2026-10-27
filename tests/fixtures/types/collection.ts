import { Collection, Differ, Period, type CollectionAnyFilter, type CollectionPeriodFilter } from '@beyond-js/ui';

// 0.44.0 (D162 L8): a period filter beside a finite one, in the shared tools and a collection.
const period: CollectionPeriodFilter = { name: 'period', label: 'Period', kind: 'period', all: 'This month', days: [1, 7], months: 3, now: () => Date.now() };
const filters: CollectionAnyFilter[] = [period, { name: 'owner', label: 'Whose', options: [{ value: 'mine', label: 'Mine' }] }];
const tools = new Collection.Tools({ label: 'Usage', filters, labels: Collection.Tools.labels.es, onchange: state => state.filters.period?.toUpperCase() });
tools.state = { filters: { period: 'P30D' } };
const range: { start: Date; end: Date } | null = Collection.Tools.Period.range(tools.state.filters.period, { now: new Date() });
const named: string | undefined = new Period({ months: 1 }, Collection.Tools.labels.es).option('2026-10')?.label;
const offered: Array<{ value: string; label: string }> = new Period({ days: [30] }).options;
const valid: boolean = Period.valid('2026-09-01/2026-09-15');
const usage = new Collection({
	label: 'Usage',
	columns: [{ key: 'name', label: 'Project' }],
	filters,
	source: async request => ({ rows: [{ name: String(Period.range(request.filters.period)?.start ?? '') }] }),
	empty: { title: 'No usage yet', action: { label: 'Open settings', href: '#/settings' } }
});
type Copy = { id: string; machine: string | null };
const machines = new Collection<Copy>({ label: 'Copies', presentation: 'list', columns: [{ key: 'id', label: 'Copy' }], source: async () => ({ rows: [] }), row: (row, { differ }) => ({ meta: differ.in((each: Copy) => each.machine) ? [row.machine ?? ''] : [] }) });
const differs: boolean = Differ.of([{ machine: 'a' }, { machine: null }], row => row.machine) || new Differ([]).in(() => 1);
const pressed = new Collection({ label: 'Usage', columns: [], source: async () => ({ rows: [] }), empty: { title: 'None', action: { label: 'Register application', run: event => event.preventDefault() } } });
// @ts-expect-error A period filter offers periods, not options of its own.
const mixed: CollectionPeriodFilter = { name: 'period', label: 'Period', kind: 'period', options: [] };
// @ts-expect-error A finite filter needs its options.
const finite: CollectionAnyFilter = { name: 'owner', label: 'Whose' };
// @ts-expect-error The months offered are a count.
new Period({ months: ['2026-10'] });
void [machines, differs, range, named, offered, valid, usage, pressed, mixed, finite];
