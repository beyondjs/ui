import { Recovery, LastUpdate, EmptyState, Section, Collection, TechnicalDetails, type RecoveryEntry, type DetailsEntry } from '@beyond-js/ui';

// An outage said once (0.24.0, D163): the notice, its reads' places and its evidence.
const recovery = new Recovery({ title: 'Beyond Accounts did not answer', whole: false, level: 2 });
const entry: RecoveryEntry = { title: 'Machines', details: { request: 'req_1', time: Date.now(), text: 'Beyond Accounts is unavailable' }, run: async () => false };
recovery.set('machines', entry);
recovery.whole = true;
recovery.title = 'Beyond Projects did not answer';
const place = new EmptyState({ kind: 'outage' });
const kept = new LastUpdate({ time: '2026-10-23T10:04:05Z', locale: 'es', labels: LastUpdate.labels.es });
const said: string = LastUpdate.say(null);
const section = new Section({ title: 'Machines', unavailable: true, updated: { time: null } });
section.unavailable({ title: 'Machines are not available right now' });
section.updated = Date.now();
const rows: DetailsEntry[] = [{ label: 'Machines', request: 'req_1', time: null }];
const details = new TechnicalDetails({ entries: rows });
const list = new Collection<{ id: string }>({ label: 'Requests', columns: [], source: Collection.local([]), recovery, outage: error => error instanceof Error, details: () => ({ request: 'req_2' }) });
export { place, kept, said, details, list };
// @ts-expect-error a Recovery entry has no reason of its own: kept content says its time in place
recovery.set('work', { title: 'Work', reason: 'Previously loaded content is shown.', run: async () => false });
