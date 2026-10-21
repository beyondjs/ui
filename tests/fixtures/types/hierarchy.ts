import { Hierarchy, type HierarchyPaint } from '@beyond-js/ui';
import { Hierarchy as Same } from '@beyond-js/ui/react';

/** 0.19.0's `Hierarchy` (D158): a heading outranks what it names, warned while a product is developed. */
const paint = (node: Element): HierarchyPaint => ({ size: node.localName === 'h3' ? 16 : 15, weight: node.localName === 'h3' ? 600 : 400, shown: true });
const watched = new Hierarchy({ root: document.body, warn: (message, heading) => [message, heading.localName], measure: paint, wait: 50 });
const failing = watched.check().map(item => (item.reason === 'outranked' ? `${item.by?.text} ${item.by?.size}` : item.heading.localName));
const enabled: boolean = Same.enabled && Hierarchy.weight === 600;
watched.destroy();
export { failing, enabled };
