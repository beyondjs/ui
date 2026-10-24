/**
 * A delayed initial read, named as the family's session step; the page becomes useful only after it
 * settles, under a bar with the family lockup the opening hands its identity over to.
 *
 * `?regions` (0.31.0): after the session, the page draws its structure at once, as LOAD-01 asks: a family
 * bar still loading and a region waiting for its first read (`/content`); when that read answers, the
 * region holds its content and the bar has loaded. `?redraw` draws the bar's brand again while the
 * identity lands on it, as a bar that loads during the hand-over does.
 */
const root = document.getElementById('root');
const query = new URLSearchParams(location.search);
// `?unnamed`: a region that names no step and adds a note while it waits, as a product's own veil can
const unnamed = query.has('unnamed');
const pending = document.createElement(unnamed ? 'section' : 'p');
pending.dataset.buiOpeningWait = unnamed ? '' : 'session';
if (unnamed) {
	const line = document.createElement('p');
	line.textContent = 'Leyendo tus proyectos… Un momento.';
	pending.append(line);
	setTimeout(() => pending.append(Object.assign(document.createElement('p'), { textContent: 'Está tardando más de lo habitual.' })), 50);
} else pending.textContent = 'Confirmando tu sesión…';
root.append(pending);
const response = await fetch('/state');

/** The family lockup's parts the opening lands on: the wordmark, the separator and the product menu with its chevron */
function brand() {
	const product = document.createElement('div');
	product.className = 'bui-family-product';
	const button = document.createElement('button');
	button.className = 'bui-navmenu-button';
	button.type = 'button';
	const name = Object.assign(document.createElement('span'), { className: 'bui-lockup-name', textContent: 'Projects' });
	const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	chevron.setAttribute('class', 'bui-icon');
	chevron.setAttribute('viewBox', '0 0 24 24');
	button.append(name, chevron);
	product.append(button);
	return product;
}

const bar = document.createElement('header');
bar.className = 'bui-family';
const mark = document.createElement('img');
mark.className = 'bui-lockup-mark';
mark.src = '/wordmark.svg';
mark.alt = '';
const title = document.createElement('h1');
title.textContent = response.ok ? 'Your projects' : 'The service is unavailable';

if (query.has('regions')) {
	bar.dataset.state = 'loading';
	bar.append(mark, brand());
	const region = document.createElement('section');
	region.setAttribute('aria-busy', 'true');
	const heading = Object.assign(document.createElement('h2'), { textContent: 'Recent' });
	const wait = Object.assign(document.createElement('div'), { className: 'bui-waiting' });
	const status = Object.assign(document.createElement('p'), { textContent: 'Cargando…' });
	status.setAttribute('role', 'status');
	wait.append(status, Object.assign(document.createElement('div'), { className: 'bui-skeleton' }));
	region.append(heading, wait);
	root.replaceChildren(bar, title, region);
	if (query.has('redraw')) {
		// Once the hand-over starts, the bar draws its brand again, as one whose read ends meanwhile does
		new MutationObserver((changes, observer) => {
			if (document.getElementById('bui-opening')?.dataset.state !== 'leaving') return;
			observer.disconnect();
			setTimeout(() => {
				bar.querySelector('.bui-family-product').replaceWith(brand());
				bar.dataset.redrawn = '';
			}, 60);
		}).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
	}
	await fetch('/content');
	wait.replaceWith(Object.assign(document.createElement('p'), { id: 'content', textContent: 'Two projects' }));
	region.removeAttribute('aria-busy');
	bar.dataset.state = 'ready';
} else {
	bar.append(mark, Object.assign(document.createElement('span'), { className: 'bui-lockup-name', textContent: 'Projects' }));
	const line = document.createElement('p');
	line.textContent = response.ok ? 'Two projects' : 'Try again in a moment';
	root.replaceChildren(bar, title, line);
}
