// The icon catalog and Preferences in the plain DOM consumer: every icon at 16, 20 and 24 px, a
// labelled one, and the appearance and language of a product whose default is light and English.
// Preferences restores before anything renders, as a product's first paint does; window.fixture.arrive
// applies an account's values, and the appearance buttons choose on this device only.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { icon, icons, Preferences, Button, el } from '@beyond-js/ui';

const preferences = new Preferences({ key: 'ui-acceptance', fallback: { appearance: 'light', locale: 'en' } });
preferences.restore();

const root = document.getElementById('root');
const grid = el('section', { id: 'catalog', class: 'icons', 'aria-label': 'Icons' });
for (const size of [16, 20, 24]) grid.append(el('div', { class: 'row', 'data-size': String(size) }, icons.map(name => icon(name, { size }))));
const named = el('p', { id: 'named' }, [icon('bell', { size: 24, label: 'Notifications' })]);
const state = el('p', { id: 'state' });
const choices = Preferences.appearances.map(appearance => new Button({ label: appearance, onclick: () => preferences.choose({ appearance }) }));
const everywhere = el('a', { id: 'everywhere', href: '#/account' });
// The copy follows the language in effect, as a localized product's does.
const show = values => {
	state.textContent = `${values.appearance} ${values.locale}`;
	Preferences.appearances.forEach((appearance, index) => (choices[index].label = preferences.labels[appearance]));
	everywhere.textContent = preferences.labels.everywhere;
};
show(preferences.current);
const release = preferences.subscribe(show);
root.append(grid, named, state, el('div', { class: 'row', id: 'choices' }, choices.map(button => button.element)), everywhere);

window.fixture = {
	preferences,
	arrive: values => preferences.apply(values),
	destroy() {
		release();
		for (const button of choices) button.destroy();
		root.replaceChildren();
	},
	ready: true
};
