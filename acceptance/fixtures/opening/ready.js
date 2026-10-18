/** A delayed initial read; the page becomes useful only after it settles. */
const root = document.getElementById('root');
const pending = document.createElement('p');
pending.dataset.buiOpeningWait = '';
pending.textContent = 'Reading…';
root.append(pending);
const response = await fetch('/state');
const title = document.createElement('h1');
title.textContent = response.ok ? 'Your projects' : 'The service is unavailable';
root.replaceChildren(title);
