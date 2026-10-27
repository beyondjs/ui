import { Labels, Unavailable, RetryAction, AgainLine, loading } from '@beyond-js/ui';

// 0.44.0: a component's words chosen from the language, by its own `locale` or the page's `<html lang>`.
const words = new Labels(Unavailable.labels, { owner: 'Quién decide: ' }, 'es-AR');
const language: string = words.language;
const owner: string = words.text('owner');
const all = words.entries;
const plain = new Labels({ busy: '{label}…' });
const action = new RetryAction({ run: async () => undefined, locale: 'es' });
const line: string = AgainLine.say({ active: true, trying: false, last: Date.now(), offline: false }, { locale: 'es' });
const named: string = loading.text({ name: 'Projects' });
export { language, owner, all, plain, action, line, named };
