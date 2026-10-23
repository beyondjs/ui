/**
 * A delayed initial read, named as the family's session step; the page becomes useful only after it
 * settles, under a bar with the family lockup the opening hands its identity over to.
 */
const root = document.getElementById('root');
// `?unnamed`: a region that names no step and adds a note while it waits, as a product's own veil can
const unnamed = new URLSearchParams(location.search).has('unnamed');
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
const bar = document.createElement('header');
bar.className = 'bui-family';
const mark = document.createElement('img');
mark.className = 'bui-lockup-mark';
mark.src = '/wordmark.svg';
mark.alt = '';
const name = document.createElement('span');
name.className = 'bui-lockup-name';
name.textContent = 'Projects';
bar.append(mark, name);
const title = document.createElement('h1');
title.textContent = response.ok ? 'Your projects' : 'The service is unavailable';
const line = document.createElement('p');
line.textContent = response.ok ? 'Two projects' : 'Try again in a moment';
root.replaceChildren(bar, title, line);
