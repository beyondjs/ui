import { Status, ListRow, CopyValue, Checklist, EmptyState, CommandCard, skeleton, type StatusTone } from '@beyond-js/ui';

const status = new Status({ state: 'busy', variant: 'badge', live: true, labels: Status.labels.es });
status.state = 'asleep';
status.label = null;
const tone: StatusTone = Status.tone('waking');
const row = new ListRow({ title: 'web', href: '/machines/web', meta: ['Standard', '2 conversations'], lead: { state: 'ready' }, status: { state: 'busy', label: 'Busy · 1 running' }, facts: ['3 d'], actions: [{ label: 'Wake', run: () => undefined }], menu: [{ label: 'Delete', tone: 'danger', run: () => undefined }], select: { checked: true, onchange: (checked: boolean) => checked } });
row.update({ title: 'web', current: true });
const copy = new CopyValue({ value: 'req_8f2c1e', label: 'the request identifier', cut: 'middle' });
const list = new Checklist({ title: 'Set up this project', steps: [{ key: 'machine', title: 'Create a machine', action: { label: 'Create', run: () => undefined } }, { key: 'engine', title: 'Connect Claude Code', state: 'blocked', reason: 'Needs a machine' }] });
const empty = new EmptyState({ kind: 'match', title: 'No conversation matches', clear: () => undefined, checklist: list });
const card = new CommandCard({ title: 'Claude Code asks to run a command', command: 'npm test', scope: { label: 'Always allow commands like this' }, allow: ({ scope }) => scope, deny: () => undefined });
const answered: Promise<boolean> = card.answer('allow');
const shaped: HTMLElement = skeleton({ rows: 4, kind: 'list' });
export { status, tone, row, copy, empty, answered, shaped };
