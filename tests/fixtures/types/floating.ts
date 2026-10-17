import { Floating, ActionMenu, ChoiceChip, Disclosure, type FloatingRefusal } from '@beyond-js/ui';

const surface = document.createElement('div');
const field = document.createElement('textarea');
const floating = new Floating(surface, { anchor: { contextElement: field, getBoundingClientRect: () => field.getBoundingClientRect() }, placement: 'below', align: 'center', quiet: true });
floating.retry = () => floating.show();
const shown: boolean = floating.show();
const side: 'below' | 'above' = floating.side;
floating.place();
floating.hide();
const opened: boolean = new ActionMenu({ label: 'More', items: [] }).open();
const chip = new ChoiceChip({ label: 'Machine', options: [], glyph: 'box' });
const chosen: boolean = chip.open();
const panel: boolean = new Disclosure({ label: 'Details' }).open();
document.addEventListener('bui-refused', event => {
	const detail = (event as CustomEvent<FloatingRefusal>).detail;
	if (detail.reason === 'hidden') detail.retry();
});
export { shown, side, opened, chosen, panel };
