/** Declarations of 0.17.1 in the DOM: Again, AgainLine, Unavailable's again and the bar's brand and account setters. */
import { Again, AgainLine, Unavailable, FamilyBar } from '@beyond-js/ui/dom';
import type { AgainMoments } from '@beyond-js/ui/dom';

const again = new Again({ run: async () => fetch('/v1/state'), steps: [1000, 2000], events: window, page: document });
const release: () => void = again.listen((moments: AgainMoments) => void moments.last);
again.start();
const answered: Promise<boolean> = again.now();
const line = new AgainLine({ again, locale: 'es', labels: AgainLine.labels.es });
const words: string = AgainLine.say(again.moments, { locale: 'en' });
const outage = new Unavailable({ title: 'Snapshots is not answering', reason: 'Nothing was lost.', kind: 'outage', again: async () => undefined, locale: 'en', labels: { retry: 'Try again' } });
void outage.again?.now();
const bar = new FamilyBar({ product: 'delegate', brand: { src: '/logo.svg', href: '/' } });
bar.brand = { src: '/logo.svg', href: '/home/' };
bar.account = { label: 'Account' };
export { release, answered, line, words };
