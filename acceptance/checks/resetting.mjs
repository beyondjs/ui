import { expect } from '../support/browser.mjs';

/**
 * Focus under a product's reset (0.44.0, D187), measured in a real engine. The reset page loads the package's
 * styles, then a product's unlayered reset (`fixtures/reset.css`, Tailwind 3's `:-moz-focusring { outline: auto; }`,
 * which only Firefox applies) and no focus rule of the product's own. Walked from the keyboard with and without the
 * reset, every control draws the family's ring and the same paint, the package's own and the product's; a field and
 * a product's own box light their edge; the command palette's field, the family bar's search field and a heading
 * focused for reading draw nothing; and `Focus` names nothing of it, but names a product's own ring on a heading and
 * a coral border on a field.
 */
async function open(browser, consumer, reset) {
	const view = await browser.open(consumer, { file: 'reset.html', query: reset ? '' : '?reset=off', viewport: { width: 1280, height: 900 } });
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** A role's color as the engine computes it. */
const role = (page, name) =>
	page.evaluate(token => {
		const probe = document.body.appendChild(document.createElement('i'));
		probe.style.color = `var(${token})`;
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, name);

/** What the focused element draws once settled, named by the fixture's id on it or around it (a class outside the page's main), with its lit box's edge. */
const drawn = page =>
	page.evaluate(async () => {
		const node = document.activeElement;
		const box = node.closest('.bui-edge, .bui-navmenu-search');
		await Promise.all([node, box].filter(Boolean).flatMap(part => part.getAnimations()).map(animation => animation.finished.catch(() => undefined)));
		const style = getComputedStyle(node);
		const edge = box ? getComputedStyle(box).borderTopColor : null;
		return { id: node.closest('main [id]:not([id^="bui-"])')?.id ?? node.className, outline: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor, border: style.borderTopColor, edge };
	});

/** The key that moves through every element: WebKit's Tab skips links and buttons, as Safari's does, so Option+Tab there. */
const next = browser => (browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab');

/** Every form the page draws, walked from the keyboard: its controls and fields, a heading, the palette's and the bar's fields. */
async function walk(browser, page) {
	const seen = [];
	await page.locator('#before').focus();
	for (let step = 0; step < 12; step += 1) {
		await page.keyboard.press(next(browser));
		seen.push(await drawn(page));
		if (seen.at(-1).id === 'read') break;
	}
	await page.keyboard.press('Enter');
	seen.push(await drawn(page));
	await page.locator('#search').focus();
	await page.keyboard.press(next(browser));
	await page.keyboard.press(`Shift+${next(browser)}`);
	await page.keyboard.press('Enter');
	await page.waitForFunction(() => document.activeElement?.classList.contains('bui-palette-field'));
	seen.push(await drawn(page));
	await page.keyboard.press('Escape');
	await page.locator('.bui-family-wide [data-part="project"] .bui-navmenu-button').click();
	await page.locator('.bui-family-wide [data-part="project"] .bui-navmenu-field').focus();
	seen.push(await drawn(page));
	await page.keyboard.press('Escape');
	return seen;
}

export const checks = [
	{
		name: "focus under a product's reset: with Tailwind 3's unlayered :-moz-focusring and no rule of the product's own, a control keeps the family's ring, a field its edge, the palette's and the bar's fields and a heading nothing, as without the reset",
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, true);
			const [coral, edge] = [await role(page, '--color-focus'), await role(page, '--color-focus-edge')];
			const seen = await walk(browser, page);
			const by = Object.fromEntries(seen.map(each => [each.id, each]));
			const missing = ['open', 'create', 'own', 'notify', 'name', 'region', 'inside', 'search', 'read', 'results'].filter(id => !by[id]);
			expect(!missing.length, `the walk reached every form: missing ${missing}, saw ${seen.map(each => each.id)}`);
			for (const id of ['open', 'create', 'own', 'notify', 'search', 'read']) {
				const ring = by[id];
				expect(ring.outline === 'solid' && ring.width === '2px' && ring.offset === '2px' && ring.color === coral, `${id}: the family's ring, coral, 2 px, 2 px out: ${JSON.stringify(ring)}`);
			}
			for (const id of ['name', 'region']) expect(by[id].outline === 'none' && by[id].border === edge, `${id}: no ring, its edge lit: ${JSON.stringify(by[id])}`);
			expect(by.inside.outline === 'none' && by.inside.edge === edge, `a product's own box lights its edge and its field draws nothing: ${JSON.stringify(by.inside)}`);
			expect(by.results.outline === 'none', `a heading focused for reading draws nothing: ${JSON.stringify(by.results)}`);
			const [field, search] = seen.slice(-2);
			expect(/bui-palette-field/.test(field.id) && field.outline === 'none', `the command palette's field draws nothing: ${JSON.stringify(field)}`);
			expect(/bui-navmenu-field/.test(search.id) && search.outline === 'none' && search.edge === edge, `the family bar's search field draws nothing, its box lit: ${JSON.stringify(search)}`);
			// A press draws none (WebKit does not focus a pressed button)
			await page.locator('#create').click();
			const pressed = await page.evaluate(() => getComputedStyle(document.getElementById('create')).outlineStyle);
			expect(pressed === 'none', `a press draws none: ${pressed}`);
			const plain = await open(browser, consumer, false);
			const without = await walk(browser, plain.page);
			expect(JSON.stringify(without) === JSON.stringify(seen), `the reset changes nothing focus draws: ${JSON.stringify(seen.filter((each, index) => JSON.stringify(each) !== JSON.stringify(without[index])))} against ${JSON.stringify(without.filter((each, index) => JSON.stringify(each) !== JSON.stringify(seen[index])))}`);
		}
	},
	{
		name: "focus under a product's reset, warned: Focus names nothing the package draws, and names a product's own ring on a heading and a coral border on a field, once each",
		consumers: ['dom'],
		async run(browser, consumer) {
			for (const reset of [true, false]) {
				const { page } = await open(browser, consumer, reset);
				await walk(browser, page);
				await page.waitForTimeout(400);
				const quiet = await page.evaluate(() => window.fixture.warned);
				expect(quiet.length === 0, `${reset ? 'with' : 'without'} the reset, nothing the package draws is named: ${JSON.stringify(quiet)}`);
				for (const id of ['ringed', 'coral', 'ringed']) {
					await page.locator(`#${id}`).focus();
					await page.waitForTimeout(250);
				}
				const warned = await page.evaluate(() => window.fixture.warned);
				expect(warned.length === 2, `once each: ${JSON.stringify(warned)}`);
				expect(warned[0].id === 'ringed' && warned[0].message.includes('the h2 "Ringed", focused for reading, draws an outline; D187: a place reading starts draws nothing.'), `the heading's ring: ${JSON.stringify(warned[0])}`);
				expect(warned[1].id === 'coral' && /the input "Coral" draws .*the ring's coral \(--color-focus\) when focused; D187: a box that takes typing lights its edge\./.test(warned[1].message), `the field's coral: ${JSON.stringify(warned[1])}`);
			}
		}
	}
];
