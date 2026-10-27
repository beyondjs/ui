import { EndLine, NotificationInbox, type NotificationAdapter } from '@beyond-js/ui';

declare const adapter: NotificationAdapter;
const header = document.createElement('div');
const inbox = new NotificationInbox({ adapter, products: { cdn: 'CDN' }, tools: 'external', labels: NotificationInbox.labels.es });
header.append(inbox.tools.element);
const line: HTMLParagraphElement = new EndLine({ text: 'Nothing older.', keys: true, labels: EndLine.labels.es }).element;
header.append(line);
// @ts-expect-error The inbox's tools are inline or external, nothing else.
new NotificationInbox({ adapter, tools: 'expanded' });
// @ts-expect-error The end line's labels are its own two words.
new EndLine({ labels: { more: 'More' } });
