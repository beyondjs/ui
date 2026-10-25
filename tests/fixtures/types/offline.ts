import { Recovery, Again, AgainLine, EmptyState, Picker, ChangeOutcome, FocusedForm, Session, NotificationInbox, CauseName, type ChangeOutcomeRecord } from '@beyond-js/ui';

// 0.33.0: offline said once, a picker joining the page's notice, a cell's outage, a change's outcome and who did not answer a session.
const notice = new Recovery({ title: 'The development service did not answer', local: true, labels: Recovery.labels.es });
const offline: boolean = notice.offline || notice.local;
const again = new Again({ run: async () => false, network: { onLine: false } });
const away: boolean = again.offline;
const line: string = AgainLine.say({ active: true, trying: false, last: Date.now(), offline: true });
const cell = new EmptyState({ kind: 'outage', inline: true });
const picker = new Picker({ label: 'Repositories', source: async () => ({ items: [] }), recovery: notice, outage: error => error instanceof TypeError, details: () => ({ request: 'req_1' }) });
const unknown: ChangeOutcomeRecord = { outcome: 'unknown', cause: 'Conduict did not answer', check: { label: 'Check the machine', run: () => undefined }, details: { request: 'req_2' } };
const drawn: HTMLElement = ChangeOutcome.draw(unknown, ChangeOutcome.labels.es);
const form = new FocusedForm(document.createElement('form'), { submit: async () => undefined, explain: () => ({ outcome: 'unavailable', cause: 'Beyond Projects did not answer' }) });
const session = new Session({ product: 'desktop', source: 'projects', read: async () => ({ state: 'unavailable', source: 'projects' }), start: () => null });
const source: string | null = session.notice.source;
const inbox = new NotificationInbox({ adapter: null as never, locale: 'es' });
export { offline, away, line, cell, picker, drawn, form, source, inbox };
// @ts-expect-error a change's outcome is unavailable or unknown, never a failure's words
const wrong: ChangeOutcomeRecord = { outcome: 'failed' };
ChangeOutcome.answer({ text: 'Renaming waits for the machine.', tone: 'warning' });
const cdn: string = CauseName.of('cdn');
ChangeOutcome.draw({ outcome: 'unavailable', cause: cdn, again: async () => undefined });
