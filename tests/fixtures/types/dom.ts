// A plain DOM consumer in TypeScript: compiled, never run, to check the `dom` and `tokens` declarations.
import { Dialog, Picker, NotificationEntry, Header, Collection, confirm, type NotificationAdapter } from '@beyond-js/ui';
import { tokens, TokenSheet } from '@beyond-js/ui/tokens';

declare const adapter: NotificationAdapter;
const entry = new NotificationEntry({ adapter, href: '/notifications', products: { cdn: 'CDN' } });
const header = new Header({ brand: { label: 'Beyond', href: '/' }, notifications: entry.element }).mount(document.body);
header.expanded = true;
const dialog = new Dialog({ title: 'Rename', escape: false });
dialog.busy = true;
const picker = new Picker({ label: 'People', source: async () => ({ items: [], next: null }) });
picker.mark('p1', { state: 'stale', reason: 'Moved' });
const list = new Collection<{ id: string }>({ label: 'Rows', columns: [{ key: 'id', label: 'Id' }], source: Collection.local([{ id: 'a' }]) });
list.state = { query: '', filters: {}, page: 1 };
const sheet: string = new TokenSheet(tokens).css;
void confirm({ title: 'Leave?' }).then((answer: boolean) => answer && sheet);
