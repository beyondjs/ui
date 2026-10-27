import { PageHeader, Section, SectionPart, Arrival, Sidebar, Button, reserved, type SidebarObject } from '@beyond-js/ui';

// What a page holds while its object's first read runs (0.44.0, LOAD-01, D185).
const header = new PageHeader({ title: null, waiting: true, labels: { loading: 'Cargando…' }, actions: [reserved(new Button({ label: 'Restore' }))] });
const waits: boolean = header.waiting;
header.wait();
header.title = 'web';
header.actions = [new Button({ label: 'Restore' })];
const section = new Section({ title: 'Devices' });
const part: SectionPart = section.part({ waiting: { rows: 2 } });
section.children = [part.element];
part.children = [document.createElement('ul')];
part.wait(1);
const known: boolean = part.waiting;
const arrival = new Arrival({ product: 'Beyond Projects', href: null });
arrival.href = '/projects/p1';
const back: string | null = arrival.href;
const objects: SidebarObject = { kind: 'object', heading: 'Projects', waiting: { rows: 2 } };
new Sidebar({ product: 'Beyond Home', groups: [objects, { kind: 'object', heading: 'Projects', waiting: true, groups: [] }] });
// @ts-expect-error a part's wait takes a shape, not words
section.part({ waiting: 'soon' });
void [waits, known, back];
