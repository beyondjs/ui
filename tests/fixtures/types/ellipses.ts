import { Ellipses } from '@beyond-js/ui';
import { Ellipses as Same } from '@beyond-js/ui/react';

/** 0.28.0's `Ellipses` (D179): a visible action is named whole, warned while a product is developed. */
const watched = new Ellipses({ root: document.body, warn: (message, action) => [message, action.localName] });
const found: string[] = watched.check().map(item => `${item.action.localName} ${item.text}`);
const words: string = Ellipses.words(document.body);
const enabled: boolean = Same.enabled && Ellipses.menus.length > 0 && Ellipses.actions.length > 0;
watched.destroy();
export { found, words, enabled };
