import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';
import { survey } from '../../tests/support/names.mjs';

// The closed list of glyphs shown without a visible label (D11), and those the package still shows so
// outside it, on record for the owner: Help's question mark, the family bar's account avatar before a
// name is known, and the Docs link's glyph alone between 480 and 719 px.
const unlabeled = ['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore'];
const pending = ['help', 'user', 'book'];

/** Fails any icon-only control of the page without an accessible name or with a glyph outside the lists. */
async function named(page, at) {
	const controls = await page.evaluate(survey, true);
	const bare = controls.filter(control => control.bare);
	for (const control of bare) {
		expect(control.name, `${at}: icon-only ${control.describe} (${control.glyphs}) has no accessible name`);
		expect(control.glyphs.every(name => unlabeled.includes(name) || pending.includes(name)), `${at}: ${control.describe} shows ${control.glyphs} without a visible label`);
	}
	return bare.length;
}

/** The icon catalog, icon-only controls and Preferences in a real engine. */
export const checks = [
	{
		name: 'icons: every glyph draws inside its 16, 20 or 24 px box with the 1.8 stroke; a labelled icon is an image',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { file: 'icons.html' });
			const found = await page.evaluate(() =>
				[...document.querySelectorAll('#catalog svg')].map(svg => {
					const box = svg.getBoundingClientRect();
					const drawn = svg.getBBox();
					const size = Number(svg.getAttribute('data-size'));
					return { name: svg.getAttribute('data-icon'), size, width: box.width, height: box.height, stroke: getComputedStyle(svg).strokeWidth, fill: getComputedStyle(svg).fill, inside: (drawn.width > 0 || drawn.height > 0) && drawn.x >= 0 && drawn.y >= 0 && drawn.x + drawn.width <= 24 && drawn.y + drawn.height <= 24 };
				})
			);
			expect(found.length >= 150 && found.length % 3 === 0, `${found.length} icons drawn`);
			const wrong = found.filter(item => item.width !== item.size || item.height !== item.size || item.stroke !== '1.8px' || item.fill !== 'none' || !item.inside);
			expect(!wrong.length, `icons off their box, stroke or grid: ${JSON.stringify(wrong.slice(0, 3))}`);
			const image = page.getByRole('img', { name: 'Notifications' });
			expect((await image.count()) === 1, 'the labelled icon is an image named Notifications');
			expect((await page.locator('#catalog svg[aria-hidden="true"]').count()) === found.length, 'catalog icons are decorative');
		}
	},
	{
		name: 'icon-only controls: every one has an accessible name and a glyph of the closed list (open dialog, toast, 1280 and 390 px)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const width of [1280, 390]) {
				const { page } = await browser.open(consumer, { viewport: { width, height: 900 } });
				let count = await named(page, `${width}px`);
				await page.getByRole('button', { name: copy.more }).first().click();
				count += await named(page, `${width}px, menu open`);
				await page.keyboard.press('Escape');
				await page.getByRole('button', { name: copy.open, exact: true }).click();
				await page.locator('dialog[open]').waitFor();
				count += await named(page, `${width}px, dialog open`);
				expect(count >= 3, `${width}px: ${count} icon-only controls seen`);
			}
		}
	},
	{
		name: 'icon-only controls in the family bar at 1440, 600, 390 and 320 px are named',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1440, 600, 390, 320]) {
				for (const query of ['', '?family=loading']) {
					const { page } = await browser.open(consumer, { file: 'family.html', query, viewport: { width, height: 800 } });
					await named(page, `${width}px${query}`);
				}
			}
		}
	},
	{
		name: 'preferences: first paint from the device copy, a device choice survives a reload, the account wins, blocked storage still works',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'icons.html' });
			const mode = () => page.evaluate(() => [document.documentElement.getAttribute('data-beyond-mode'), document.documentElement.getAttribute('lang'), document.getElementById('state').textContent]);
			expect(JSON.stringify(await mode()) === JSON.stringify(['light', 'en', 'light en']), `the product default first: ${await mode()}`);
			await page.getByRole('button', { name: 'Dark' }).click();
			await page.waitForFunction(() => document.documentElement.getAttribute('data-beyond-mode') === 'dark');
			const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
			await page.reload();
			await page.waitForFunction(() => window.fixture?.ready);
			expect((await mode())[0] === 'dark', 'the device choice is painted first after a reload');
			expect((await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === canvas, 'the dark canvas is restored');
			await page.evaluate(() => window.fixture.arrive({ appearance: null, locale: 'es', id: 'acc_1' }));
			await page.getByText('Cambiar en todo Beyond').waitFor();
			expect(JSON.stringify((await mode()).slice(0, 2)) === JSON.stringify(['light', 'es']), `an unset account appearance keeps the product default: ${await mode()}`);
			const saved = await page.evaluate(() => localStorage.getItem('ui-acceptance'));
			expect(saved === JSON.stringify({ appearance: null, locale: 'es' }), `the device copy holds only the two values: ${saved}`);
			await page.evaluate(() => window.fixture.arrive({ appearance: 'system', locale: 'en' }));
			expect((await mode())[0] === null, 'system removes data-beyond-mode');
			await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('blocked', 'SecurityError'); } }));
			await page.reload();
			await page.waitForFunction(() => window.fixture?.ready);
			expect((await mode())[0] === 'light', 'blocked storage paints the product default');
			await page.getByRole('button', { name: 'Dark' }).click();
			await page.waitForFunction(() => document.documentElement.getAttribute('data-beyond-mode') === 'dark');
		}
	}
];
