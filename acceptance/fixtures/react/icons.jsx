// The icon catalog and Preferences in the React consumers: every icon at 16, 20 and 24 px through
// <Icon>, a labelled one, and usePreferences over an instance restored before React renders, in
// Spanish where the person's language says so. window.fixture.arrive applies an account's values.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon, icons, Preferences, usePreferences, Button } from '@beyond-js/ui/react';

const preferences = new Preferences({ key: 'ui-acceptance', fallback: { appearance: 'light', locale: 'en' } });
preferences.restore();

function Page() {
	const { appearance, locale } = usePreferences(preferences);
	const labels = Preferences.labels[locale];
	return (
		<>
			<section id="catalog" className="icons" aria-label="Icons">
				{[16, 20, 24].map(size => (
					<div key={size} className="row" data-size={size}>
						{icons.map(name => <Icon key={name} name={name} size={size} />)}
					</div>
				))}
			</section>
			<p id="named"><Icon name="bell" size={24} label="Notifications" /></p>
			<p id="state">{`${appearance} ${locale}`}</p>
			<div className="row" id="choices">
				{Preferences.appearances.map(value => <Button key={value} label={labels[value]} onClick={() => preferences.choose({ appearance: value })} />)}
			</div>
			<a id="everywhere" href="#/account">{labels.everywhere}</a>
		</>
	);
}

const root = createRoot(document.getElementById('root'));
window.fixture = {
	preferences,
	arrive: values => preferences.apply(values),
	destroy: () => root.unmount(),
	ready: false
};
root.render(<StrictMode><Page /></StrictMode>);
requestAnimationFrame(() => (window.fixture.ready = true));
