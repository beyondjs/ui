import { expect, overflow, focused } from '../support/browser.mjs';
import { Geometry } from '../support/geometry.mjs';

/** The family bar at the family's widths and in both themes, its keyboard, its states and the lockup. */
const widths = [1440, 1024, 768, 600, 480, 390, 360, 320];
const navy = { light: 'rgb(18, 31, 54)', dark: 'rgb(12, 21, 37)' };

async function open(browser, consumer, { width = 1440, family = 'inside', ...options } = {}) {
	const view = await browser.open(consumer, { file: 'family.html', query: `?family=${family}`, viewport: { width, height: 800 }, prepare: Geometry.install, ...options });
	await view.page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(image => image.decode().catch(() => {}))]));
	return view;
}

export const checks = [
	{
		name: 'family bar at 1440, 1024, 768, 600, 480, 390, 360 and 320 px in both themes: one row, nothing outside it, centred parts, the lockup name on the letters, the Docs label wherever the link shows',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of widths) {
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme });
					const found = await Geometry.bar(page);
					const at = `${width}px ${scheme}`;
					expect(found.height === 44 && found.top === 0, `${at}: one 44px row at the top: ${JSON.stringify([found.height, found.top])}`);
					expect(found.background === navy[scheme], `${at}: navy bar ${found.background}`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					expect(found.outside.length === 0, `${at}: parts outside the bar: ${found.outside.join(', ')}`);
					expect(found.overlaps.length === 0, `${at}: overlapping parts: ${found.overlaps.join(', ')}`);
					expect(found.mark >= 21 && found.clipped === false, `${at}: wordmark ${found.mark}px, product name clipped ${found.clipped}`);
					expect(found.centres.every(([, offset]) => Math.abs(offset) <= 0.5), `${at}: centres off the bar's: ${JSON.stringify(found.centres)}`);
					expect(Math.abs(found.name.top) <= 0.5 && Math.abs(found.name.base) <= 0.5, `${at}: name against the letters ${JSON.stringify(found.name)}`);
					const narrow = width < 720;
					expect(found.narrow === narrow && found.wide === !narrow, `${at}: location form ${JSON.stringify([found.wide, found.narrow])}`);
					expect(found.docs === width >= 600, `${at}: Docs link shown ${found.docs}`);
					const label = await page.evaluate(() => document.querySelector('.bui-family-docs span')?.checkVisibility() ?? false);
					expect(label === width >= 600, `${at}: Docs label shown ${label} (D11: the book glyph never stands alone)`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'family bar from 600 to 719 px with each long product name, with and without a sidebar toggle: the Docs label shown, nothing overlapping',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [600, 660, 719]) {
				for (const product of ['workspace', 'snapshots', 'conduict', 'delegate']) {
					for (const family of ['inside', 'long']) {
						const at = `${product} ${family} at ${width}px`;
						const { page, context } = await open(browser, consumer, { width, family, query: `?family=${family}&product=${product}` });
						const found = await Geometry.bar(page);
						expect(found.height === 44 && !(await overflow(page)), `${at}: one row, no sideways scroll`);
						expect(found.outside.length === 0 && found.overlaps.length === 0, `${at}: outside ${found.outside} overlapping ${found.overlaps}`);
						expect(await page.evaluate(() => document.querySelector('.bui-family-docs span')?.checkVisibility()), `${at}: the Docs label shows`);
						await context.close();
					}
				}
			}
		}
	},
	{
		name: 'family bar on a 320px touch screen: one row, no overlapping controls, no sideways scroll',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 320, hasTouch: true, isMobile: true });
			const found = await Geometry.bar(page);
			expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'a coarse pointer');
			expect(found.height === 44 && !(await overflow(page)), `one row, no sideways scroll: ${found.height}`);
			expect(found.outside.length === 0 && found.overlaps.length === 0, `outside ${found.outside} overlapping ${found.overlaps}`);
		}
	},
	{
		name: 'family bar on phones (320 to 479 px) with each long product name, with and without a sidebar toggle: touch targets 44 × 44, nothing overlapping',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const toggle = consumer.name === 'react19';
			for (const touch of [true, false]) {
				for (const width of [320, 340, 360, 390, 479]) {
					for (const product of ['workspace', 'snapshots', 'conduict', 'delegate']) {
						const at = `${product} at ${width}px ${touch ? 'touch' : 'mouse'}${toggle ? ' with a toggle' : ''}`;
						const { page, context } = await open(browser, consumer, { width, query: `?family=inside&product=${product}`, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
						expect((await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) === touch, `${at}: pointer`);
						const found = await Geometry.bar(page);
						expect(found.height === 44 && !(await overflow(page)), `${at}: one row, no sideways scroll`);
						expect(found.outside.length === 0 && found.overlaps.length === 0, `${at}: outside ${found.outside} overlapping ${found.overlaps}`);
						const targets = await Geometry.targets(page);
						expect(targets.mark >= 21, `${at}: wordmark ${targets.mark}px`);
						if (touch) {
							const small = targets.controls.filter(control => control.width < 43.5 || control.height < 43.5);
							expect(!small.length, `${at}: targets under 44 × 44: ${JSON.stringify(small)}`);
						}
						// With a toggle on a touch screen below 380 px the location folds into the product menu.
						const folded = touch && toggle && width < 380;
						expect(targets.location === !folded, `${at}: location ${targets.location ? 'shown' : 'folded'}`);
						if (folded) {
							await page.locator('.bui-family [data-part="product"] .bui-navmenu-button').click();
							const carried = page.locator('.bui-family [data-part="product"] .bui-family-carried');
							expect((await carried.count()) === 3 && (await carried.first().isVisible()), `${at}: organizations, projects and all projects in the product menu`);
							const box = await page.locator('.bui-family [data-part="product"] .bui-navmenu-panel').boundingBox();
							expect(box && box.x >= 0 && box.x + box.width <= width, `${at}: product menu inside the viewport ${JSON.stringify(box)}`);
						}
						await context.close();
					}
				}
			}
		}
	},
	{
		name: 'family bar location at 1024, 900 and 768 px: long organization and project names share the width, neither collapses',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			// `nandu`: a short organization ("Estudio Ñandú") and a long project; `long`: both long.
			for (const family of ['nandu', 'long']) {
				for (const width of [1024, 900, 768]) {
					const { page, context } = await open(browser, consumer, { width, family });
					const at = `${family} at ${width}px`;
					const { organization, project } = await Geometry.location(page);
					const found = await Geometry.bar(page);
					expect(organization && project, `${at}: both names in the bar`);
					expect(!(await overflow(page)) && found.outside.length === 0 && found.overlaps.length === 0, `${at}: one row, nothing outside or overlapping: ${JSON.stringify(found.overlaps)}`);
					// Neither is cut to a letter or two: a name is whole or keeps at least 3.5rem of text.
					for (const [label, name] of [['organization', organization], ['project', project]]) expect(!name.cut || name.width >= 56, `${at}: ${label} collapsed: ${JSON.stringify(name)}`);
					// A cut name is never narrower than the other one, unless that one is whole or at its cap (12rem, 16rem).
					const capped = (name, cap) => !name.cut || name.button >= cap - 0.5;
					if (organization.cut && !capped(project, 256)) expect(organization.width >= project.width - 1, `${at}: organization gives way to the project: ${JSON.stringify([organization, project])}`);
					if (project.cut && !capped(organization, 192)) expect(project.width >= organization.width - 1, `${at}: project gives way to the organization: ${JSON.stringify([organization, project])}`);
					if (family === 'nandu' && width >= 900) expect(!organization.cut, `${at}: "${organization.text}" whole: ${JSON.stringify(organization)}`);
					await context.close();
				}
			}
		}
	},
	{
		name: 'lockup: the name meets the wordmark letters within 0.5 px at every height from 18 to 40 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const rows = await Geometry.lockups(page);
			expect(rows.length === 23, `23 lockups: ${rows.length}`);
			const off = rows.filter(row => Math.abs(row.top) > 0.5 || Math.abs(row.base) > 0.5);
			expect(!off.length, `off the letters: ${JSON.stringify(off)}`);
		}
	},
	{
		name: 'family bar keyboard: Enter and Space open a menu on its first entry, arrows move, Escape closes and returns focus',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const product = page.locator('.bui-family [data-part="product"] .bui-navmenu-button');
			await product.focus();
			await page.keyboard.press('Enter');
			expect((await product.getAttribute('aria-expanded')) === 'true', 'Enter opens the product menu');
			expect((await focused(page)).includes('Workspace'), `focus on the first entry: ${await focused(page)}`);
			await page.keyboard.press('ArrowDown');
			expect((await focused(page)).includes('Delegate'), `ArrowDown moves: ${await focused(page)}`);
			await page.keyboard.press('Escape');
			expect((await product.getAttribute('aria-expanded')) === 'false', 'Escape closes');
			expect(await product.evaluate(node => node === document.activeElement), 'focus returns to the product button');
			const outline = await product.evaluate(node => getComputedStyle(node).outlineColor);
			expect(outline === 'rgb(228, 111, 78)', `focus ring in the family marker: ${outline}`);
			const account = page.locator('.bui-family [data-part="account"] .bui-navmenu-button');
			await account.focus();
			await page.keyboard.press('Space');
			expect((await account.getAttribute('aria-expanded')) === 'true', 'Space opens the account menu');
			await page.keyboard.press('End');
			expect(/Sign out|Cerrar sesión/.test(await focused(page)), `End reaches Sign out: ${await focused(page)}`);
			await page.keyboard.press('Escape');
			expect(await account.evaluate(node => node === document.activeElement), 'focus returns to the account button');
			const organization = page.locator('.bui-family-wide [data-part="organization"] .bui-navmenu-button');
			await organization.focus();
			await page.keyboard.press('Enter');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			const log = await page.evaluate(() => window.fixture.log.join('|'));
			expect(log.includes('navigate:') && log.includes('organization=org_south'), `choosing an organization goes through onnavigate: ${log}`);
		}
	},
	{
		name: 'family bar menus stay inside the viewport at 390 and 320 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [480, 390, 320]) {
				const { page, context } = await open(browser, consumer, { width });
				for (const part of ['product', 'location', 'account']) {
					const trigger = page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-button`);
					await trigger.click();
					const box = await page.locator(`.bui-family [data-part="${part}"]:visible .bui-navmenu-panel`).boundingBox();
					expect(box && box.x >= 0 && box.x + box.width <= width, `${width}px ${part} panel fits: ${JSON.stringify(box)}`);
					expect(!(await overflow(page)), `${width}px ${part}: no sideways scroll`);
					await page.keyboard.press('Escape');
				}
				const docs = await page.locator('.bui-family [data-part="account"] .bui-disclosure-panel .bui-family-docs-item').isVisible();
				expect(docs === false, 'the docs entry is hidden while the menu is closed');
				await page.locator('.bui-family [data-part="account"] .bui-navmenu-button').click();
				expect(await page.locator('.bui-disclosure-panel .bui-family-docs-item').isVisible(), `${width}px: Docs moved into the account menu`);
				await context.close();
			}
		}
	},
	{
		name: 'family bar states: loading keeps the lockup in place, unavailable names where you are, the bar stays on top while scrolling',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { family: 'loading' });
			const before = await Geometry.parts(page);
			expect(before.state === 'loading' && !before.menus, `loading without location menus: ${JSON.stringify(before)}`);
			if (consumer.name === 'dom') await page.evaluate(() => (window.fixture.bar.descriptor = window.fixture.descriptors.inside));
			else await page.evaluate(() => window.fixture.show('inside'));
			await page.waitForFunction(() => document.querySelector('.bui-family').dataset.state === 'ready');
			const after = await Geometry.parts(page);
			expect(before.height === after.height && before.mark === after.mark && before.name === after.name, `no jump: ${JSON.stringify([before, after])}`);
			const failed = await open(browser, consumer, { family: 'unavailable' });
			const text = await failed.page.locator('.bui-family-wide').innerText();
			expect(text.includes('Northwind Studio') && text.includes('Storefront redesign'), `fallback names: ${text}`);
			expect((await failed.page.locator('.bui-family-thread .bui-navmenu').count()) === 0, 'no location menus');
			// The product's own addresses keep the account link, Docs and home while unavailable.
			await failed.page.locator('.bui-family [data-part="account"] .bui-navmenu-button').click();
			const account = failed.page.locator('.bui-family [data-part="account"] .bui-navmenu-panel a[href="https://accounts.example.test/account"]');
			expect((await account.count()) === 1 && (await account.isVisible()), 'the account link from the fallback addresses');
			expect((await failed.page.locator('.bui-family-docs').getAttribute('href')) === 'https://docs.example.test/', 'Docs from the fallback addresses');
			// Outside an organization nothing follows the product name: no divider, no separator.
			const bare = await open(browser, consumer, { family: 'unavailable', query: '?family=unavailable&fallback=bare' });
			const trailing = await bare.page.evaluate(() => [...document.querySelectorAll('.bui-family-thread *')].filter(node => node.getBoundingClientRect().width > 0).map(node => node.className));
			expect(!trailing.length, `nothing drawn after the product name: ${trailing}`);
			await bare.context.close();
			await page.mouse.wheel(0, 1200);
			await page.waitForFunction(() => window.scrollY > 600);
			const top = await page.evaluate(() => [document.querySelector('.bui-family').getBoundingClientRect().top, document.querySelector('.bui-productnav').getBoundingClientRect().bottom]);
			expect(top[0] === 0 && top[1] < 0, `bar sticky, product navigation scrolled away: ${top}`);
			await failed.context.close();
		}
	},
	{
		name: 'product navigation, Unavailable and a confirmation with its consequence',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 390 });
			const nav = await page.evaluate(() => {
				const list = document.querySelector('.bui-productnav-list');
				const current = list.querySelector('[aria-current="page"]').getBoundingClientRect();
				const box = list.getBoundingClientRect();
				return { scrolls: list.scrollWidth > list.clientWidth, shown: current.left >= box.left - 0.5 && current.right <= box.right + 0.5 };
			});
			expect(nav.scrolls && nav.shown, `the row scrolls and shows the current tab: ${JSON.stringify(nav)}`);
			expect(!(await overflow(page)), 'no sideways scroll');
			const tones = await page.evaluate(() => [...document.querySelectorAll('.bui-unavailable *')].some(node => getComputedStyle(node).color === 'rgb(179, 38, 30)'));
			expect(!tones, 'Unavailable uses no danger color');
			await page.locator('#patterns .bui-button-danger').click();
			const list = await page.locator('dialog .bui-consequence dt').allInnerTexts();
			expect(list.length === 3, `lost, kept and undo: ${list}`);
			// Sentence case as written (D20): innerText follows text-transform, so capitals by style would show here.
			const written = await page.locator('dialog .bui-consequence dt').evaluateAll(nodes => nodes.map(node => node.textContent));
			expect(list.every((text, index) => text === written[index]) && list.every(text => text !== text.toUpperCase()), `labels in sentence case: ${list}`);
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => window.fixture.log.includes('confirm:false'));
		}
	}
];
