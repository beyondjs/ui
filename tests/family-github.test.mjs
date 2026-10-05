import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { annotated, member, nobody } from './fixtures/family.mjs';

/** 0.7.4 (PRJ-14, D51 amending D48): "GitHub" in the profile menu's organization group, for every member. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setURL('http://localhost/app/requests?project=prj_shop');
});

const github = 'https://projects.example.test/?organization=org_north&view=github';
const make = (descriptor, labels = undefined) => new ui.FamilyBar({ product: 'delegate', brand: { src: '/brand.svg', href: '/' }, account: { signout: () => {} }, descriptor, labels }).mount(document.body);
const group = bar => [...bar.element.querySelectorAll('[data-part="account"] .bui-navmenu-section')].find(section => section.querySelector('.bui-navmenu-heading')?.textContent.includes('·'));
const labels = bar => [...(group(bar)?.querySelectorAll('.bui-navmenu-label') ?? [])].map(node => node.textContent);
const entry = bar => bar.element.querySelector('[data-part="account"] a.bui-family-github');

test('an owner reads GitHub after Organization settings, at the address the descriptor gives, as given', () => {
	const bar = make({ ...annotated, links: { ...annotated.links, github } });
	assert.deepEqual(labels(bar), ['Members and invitations', 'Organization settings', 'GitHub']);
	bar.element.querySelector('[data-part="account"] .bui-navmenu-button').click();
	assert.equal(entry(bar).getAttribute('href'), github, 'no product or return added, also once the menu opened');
	bar.destroy();
});

test('a member who does not administer reads GitHub too', () => {
	const bar = make({ ...member, links: { ...member.links, github } });
	assert.deepEqual(labels(bar), ['Members and invitations', 'GitHub']);
	bar.destroy();
});

test('no GitHub without the link, nor without an organization in view', () => {
	const plain = make(annotated);
	assert.deepEqual(labels(plain), ['Members and invitations', 'Organization settings']);
	assert.equal(entry(plain), null);
	plain.destroy();
	const alone = make({ ...nobody, links: { ...nobody.links, github } });
	assert.equal(entry(alone), null, 'a person with no organization in view');
	alone.destroy();
});

test('the Spanish set names it GitHub too, and a product may give it from its fallback', () => {
	const bar = make({ ...annotated, links: { ...annotated.links, github } }, ui.FamilyBar.labels.es);
	assert.equal(entry(bar).textContent, 'GitHub');
	assert.equal(ui.FamilyBar.labels.en.github, 'GitHub');
	bar.destroy();
	const fallback = new ui.FamilyBar({ product: 'delegate', brand: { src: '/brand.svg', href: '/' }, account: { signout: () => {} }, descriptor: annotated, fallback: { links: { github } } }).mount(document.body);
	assert.equal(entry(fallback).getAttribute('href'), github);
	fallback.destroy();
});
