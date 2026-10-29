import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Sidebar, el } from '@beyond-js/ui';
import { groups, rail } from '../data/sidebar-rail.mjs';
import { descriptors } from '../data/family.js';

const log = [];
const presentation = new URLSearchParams(location.search).get('global');
const linked = new URLSearchParams(location.search).has('linked');
const objects = linked ? { ...groups[1], href: '/conversations', current: true } : groups[1];
const current = [{ ...groups[0], items: groups[0].items.map(item => linked ? { ...item, current: false } : item) }, objects];
const root = document.getElementById('root');
const bar = new FamilyBar({ product: 'conduict', brand: { src: '../brand/wordmark.svg', href: '/home' }, descriptor: descriptors.inside }).mount(root);
const shell = root.appendChild(el('div', { class: 'bui-shell' }));
const sidebar = new Sidebar({ product: 'Conduict', groups: current, context: { label: 'Project', name: 'Storefront redesign' }, rail: presentation === 'inline' ? null : { ...rail, onchange: value => log.push(value) }, navigation: presentation ? { key: 'fixture', onchange: value => log.push(`global:${value}`) } : null, onnavigate: item => { log.push(item.label); document.querySelector('main h1')?.focus(); } }).mount(shell);
sidebar.merge(bar);
shell.append(el('main', { class: 'navigation-page' }, [el('h1', { text: 'Repositories', tabindex: '-1' }), el('p', { text: 'A fictional navigation fixture.' })]));
window.fixture = { ready: true, sidebar, log, update: () => { sidebar.groups = [{ ...groups[0], items: groups[0].items.map(item => item.key === 'machines' ? { ...item, meta: 3 } : item) }, objects]; }, destroy: () => { sidebar.destroy(); bar.destroy(); } };
