import { FamilyBar, Unavailable, callout, Tabs, productNames, type NotificationAdapter, type NoticeRequest, type FailureDetails } from '@beyond-js/ui';

const details: FailureDetails = { request: 'req_1', time: new Date() };
const bar = new FamilyBar({ product: 'packages', brand: { src: '/w.svg', href: '/' }, descriptor: { context: 'none' }, projects: false, bound: 0 });
const state: 'loading' | 'unavailable' | 'none' | 'ready' = bar.state;
const missing = new Unavailable({ title: 'Unreachable', reason: 'No answer.', kind: 'outage', details });
const failure: HTMLElement = callout({ tone: 'danger', title: 'Failed', details });
const tabs = new Tabs({ items: [{ label: 'One', href: '#1', current: true }] });
const ends: string[] = tabs.more;
const name: string = productNames.packages;
const request: NoticeRequest = { state: 'all', product: null, cursor: null, limit: 20, by: 'group' };
const adapter: NotificationAdapter = {
	summary: async () => ({ unread: 0 }),
	list: async () => ({ items: [{ id: 'n', product: 'projects', title: 'T', occurred: '', read: null, group: 'g', matter: { updates: 3, unread: 1 } }], grouped: true }),
	read: async () => null,
	unread: async () => null,
	open: async () => ({ destination: null }),
	readGroup: async (group: string, scope: { product: string }) => [group, scope.product]
};
export { state, missing, failure, ends, name, request, adapter };
