/**
 * A delayed initial read, named as the family's session step; the page becomes useful only after it
 * settles, under a bar with the family lockup the opening hands its identity over to.
 */
const root = document.getElementById('root');
const pending = document.createElement('p');
pending.dataset.buiOpeningWait = 'session';
pending.textContent = 'Confirmando tu sesión…';
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
