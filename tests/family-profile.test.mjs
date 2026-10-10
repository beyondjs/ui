import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { annotated, member, nobody } from './fixtures/family.mjs';

/** The 0.4.0 profile menu: grouped Accounts links completed with the way back, and closing when focus leaves it. */
const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());
beforeEach(() => {
	page.reset();
	page.window.happyDOM.setURL('http://localhost/');
});

const brand = { src: '/brand/wordmark.svg', href: '/own-home' };
const account = { signout: () => {}, items: [{ label: 'Delegate settings', href: '/settings' }, { label: 'Language and appearance', run: () => {} }] };
const make = (options = {}) => new ui.FamilyBar({ product: 'delegate', brand, account, ...options }).mount(document.body);
const profile = bar => bar.element.querySelector('[data-part="account"]');
// A heading's words as read: the avatar beside the person's name is aria-hidden (0.13.0)
const read = node => {
	if (!node) return null;
	const copy = node.cloneNode(true);
	for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
	return copy.textContent;
};
const groups = bar => [...profile(bar).querySelectorAll('.bui-navmenu-section')].map(section => [read(section.querySelector('.bui-navmenu-heading')), [...section.querySelectorAll('.bui-navmenu-label')].map(node => node.textContent)]);
const link = (bar, text) => [...profile(bar).querySelectorAll('a.bui-navmenu-item')].find(node => node.textContent === text);
const back = (bar, text) => new URL(link(bar, text).getAttribute('href')).searchParams;

test('groups: the person, the account, the organization in view, the product, Docs and Sign out', () => {
	const bar = make({ descriptor: annotated });
	assert.deepEqual(groups(bar), [
		['Ana Pérezana@example.test', ['Account and sign-in', 'Your organizations']],
		['Northwind · Owner', ['Members and invitations', 'Organization settings']],
		['Delegate', ['Delegate settings', 'Language and appearance']],
		[null, ['Docs']],
		[null, ['Sign out of Beyond']]
	]);
	assert.equal(profile(bar).querySelector('.bui-family-person .bui-family-name').textContent, 'Ana Pérez');
	assert.equal(profile(bar).querySelectorAll('a.bui-family-person, .bui-family-person a').length, 0, 'the person is a heading, not a link');
	assert.equal(profile(bar).querySelector('.bui-family-person .bui-family-avatar-large').textContent, 'AP', 'the head carries the avatar beside the name (D78)');
	assert.equal(profile(bar).querySelector('.bui-family-role').textContent, 'Owner', 'the role sits at the heading\'s end');
	assert.equal(profile(bar).querySelector('.bui-family-account .bui-navmenu-button > .bui-icon'), null, 'the avatar has no chevron (D78)');
	bar.destroy();
});

test('a member who does not administer sees no settings; a person without an organization is offered to create one', () => {
	const bar = make({ descriptor: member });
	assert.deepEqual(groups(bar).slice(0, 2), [
		['Ana Pérezana@example.test', ['Account and sign-in', 'Your organizations']],
		['Northwind · Member', ['Members and invitations']]
	]);
	bar.destroy();
	const alone = make({ descriptor: nobody });
	assert.deepEqual(groups(alone)[0][1], ['Account and sign-in', 'Create an organization']);
	assert.equal(link(alone, 'Create an organization').getAttribute('href').split('?')[0], 'https://accounts.example.test/organizations');
	assert.equal(back(alone, 'Create an organization').get('view'), 'create', 'Accounts\' own parameters are kept');
	assert.ok(!groups(alone).some(([heading]) => heading?.includes('·')), 'no organization group');
	alone.destroy();
});

test('every Accounts address carries the product and the way back, without the transient parameters', () => {
	page.window.happyDOM.setURL('http://localhost/app/requests?project=prj_shop&tab=2&returned=accounts&from=projects&dialog=rename&modal=1#/r/7');
	const bar = make({ descriptor: annotated, transient: ['modal'] });
	const members = back(bar, 'Members and invitations');
	assert.equal(members.get('product'), 'delegate');
	assert.equal(members.get('view'), 'members');
	assert.equal(members.get('return'), 'http://localhost/app/requests?project=prj_shop&tab=2&returned=accounts#/r/7', 'a project the path does not carry stays');
	assert.equal(back(bar, 'Account and sign-in').get('return'), members.get('return'));
	// The address is the one the person is on when the menu opens.
	page.window.happyDOM.setURL('http://localhost/o/org_north/apps?organization=org_north&q=a%20b');
	profile(bar).querySelector('.bui-navmenu-button').click();
	assert.equal(back(bar, 'Organization settings').get('return'), 'http://localhost/o/org_north/apps?q=a+b&returned=accounts', 'an organization the path carries goes');
	page.window.happyDOM.setURL('http://localhost/#/o/org_north/projects/prj_shop?project=prj_shop');
	profile(bar).querySelector('.bui-navmenu-button').click();
	profile(bar).querySelector('.bui-navmenu-button').click();
	assert.equal(back(bar, 'Your organizations').get('return'), 'http://localhost/?returned=accounts#/o/org_north/projects/prj_shop?project=prj_shop', 'a hash route carries the project; only the query loses it');
	bar.destroy();
});

test('without Accounts\' addresses the menu keeps the earlier links; a broken address is left out', () => {
	const older = make({ descriptor: { ...annotated, links: { home: annotated.links.home, account: 'https://accounts.example.test/account', members: 'https://accounts.example.test/members' } } });
	assert.deepEqual(groups(older).slice(0, 2), [
		['Ana Pérezana@example.test', ['Your account']],
		['Northwind · Owner', ['Members of this organization']]
	]);
	assert.equal(link(older, 'Your account').getAttribute('href'), 'https://accounts.example.test/account', 'the earlier link is not completed');
	older.destroy();
	const fallback = make({ descriptor: { unavailable: true }, fallback: { person: 'Ana Pérez', links: { manage: { account: 'https://accounts.example.test/account', create: 'https://accounts.example.test/organizations?view=create' } } } });
	assert.deepEqual(groups(fallback)[0][1], ['Account and sign-in', 'Create an organization'], 'the product\'s fallback addresses while unavailable');
	fallback.destroy();
	const broken = make({ descriptor: { ...annotated, links: { ...annotated.links, manage: { account: 'http://[bad', organizations: '' } } } });
	assert.equal(link(broken, 'Account and sign-in').getAttribute('href'), '#', 'an address that cannot be completed goes nowhere');
	assert.equal(link(broken, 'Your organizations'), undefined, 'an empty address is not drawn');
	broken.destroy();
});

test('the profile menu closes when focus leaves it, stays open for a press on its text, and Escape returns to the avatar', async () => {
	const outside = document.body.appendChild(Object.assign(document.createElement('button'), { textContent: 'Elsewhere' }));
	const bar = make({ descriptor: annotated });
	const trigger = profile(bar).querySelector('.bui-navmenu-button');
	page.key(trigger, 'Enter');
	trigger.click();
	const last = profile(bar).querySelector('.bui-family-signout');
	last.focus();
	last.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
	assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'no new target: still open');
	last.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: profile(bar).querySelector('a.bui-navmenu-item') }));
	assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'focus moving inside: still open');
	outside.focus();
	last.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
	assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'Tab past the last entry closes it');
	assert.ok(document.activeElement === outside, 'focus stays where it went');
	trigger.click();
	// An engine that reports no new target (WebKit): the menu looks where focus settled.
	outside.focus();
	profile(bar).querySelector('.bui-navmenu-panel').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
	await page.until(() => trigger.getAttribute('aria-expanded') === 'false');
	trigger.click();
	page.key(profile(bar).querySelector('.bui-navmenu-panel'), 'Escape');
	assert.ok(document.activeElement === trigger, 'Escape returns focus to the avatar');
	bar.destroy();
	outside.remove();
});

test('the person\'s picture lies over the initials; one that fails or is not https is never shown (D81)', () => {
	const picture = (avatar, name = 'Ana Pérez') => make({ descriptor: { ...annotated, person: { ...annotated.person, name, avatar } } });
	const shown = picture('https://pictures.example.test/ana.png');
	const [bar, head] = [...profile(shown).querySelectorAll('.bui-family-avatar')];
	for (const avatar of [bar, head]) {
		assert.equal(avatar.querySelector('img').getAttribute('src'), 'https://pictures.example.test/ana.png');
		assert.equal(avatar.querySelector('img').getAttribute('referrerpolicy'), 'no-referrer', 'the provider never learns which product asked');
		assert.equal(avatar.querySelector('img').getAttribute('alt'), '', 'the name is said once, by the button');
	}
	bar.querySelector('img').dispatchEvent(new Event('error'));
	assert.equal(bar.querySelector('img'), null, 'a picture that fails is removed');
	assert.equal(bar.textContent, 'AP', 'the initials remain');
	shown.destroy();
	for (const refused of ['http://pictures.example.test/ana.png', 'javascript:alert(1)', 'not an address']) {
		const other = picture(refused);
		assert.equal(profile(other).querySelector('.bui-family-avatar img'), null, refused);
		other.destroy();
	}
	const inline = picture('data:image/png;base64,iVBORw0KGgo=');
	assert.ok(profile(inline).querySelector('.bui-family-avatar img'), 'an image data address is shown');
	inline.destroy();
	const handle = picture(null, 'boxenrique');
	assert.equal(profile(handle).querySelector('.bui-family-account .bui-navmenu-button .bui-family-avatar').textContent, 'B', 'a handle is one word: one initial');
	handle.destroy();
});
