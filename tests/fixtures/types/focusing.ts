import { Focus } from '@beyond-js/ui';
import type { FocusPaint } from '@beyond-js/ui';
import { Focus as Same } from '@beyond-js/ui/react';
import type { FocusPaint as Read } from '@beyond-js/ui/react';

/** 0.44.0's `Focus` (D187): focus says what the keys do there, warned while a product is developed. */
const paint: FocusPaint = { outline: 'solid', width: 2, color: 'rgb(203, 98, 69)', borders: [], shadow: 'none', focus: '#cb6245', danger: '#b3261e' };
const again: Read = paint;
const watched = new Focus({ root: document, warn: (message, node) => [message, node.localName], measure: () => again });
const found = watched.check(document.body);
const drawn: string[] = found ? found.drawn.map(each => `${found.reason} ${each}`) : [];
const enabled: boolean = Same.enabled && Focus.controls.length > 0 && Focus.fields.length > 0;
new Same({ root: document.body }).destroy();
watched.destroy();
export { drawn, enabled };
