import { expect } from '../support/browser.mjs';

/**
 * 0.5.0 (D50, E52, D43, D44, Q09): the awaited card and its steps at their thresholds on an injected
 * clock, reload, Check again, reduced motion; freshness; technical details copied or refused; cut names
 * shown whole on hover and focus and whole in the open menu; signing out of Beyond through /leave.
 */
const words = {
	en: { left: 'About 2 min left', brief: 'Less than a minute left', slow: 'Taking longer than usual', check: 'Check again', step: '6 s so far · usually about 1 min', late: 'taking longer than usual', blocked: 'Conduict cannot reach the machine.', checked: 'Checked 3 min ago', known: /^Last known: Running · \d\d:\d\d$/, copied: 'Copied', refused: 'Could not copy', summary: 'Technical details', leaving: 'Signing out…', signout: 'Sign out of Beyond' },
	es: { left: 'Queda aproximadamente 2 min', brief: 'Queda menos de un minuto', slow: 'Está tardando más de lo habitual', check: 'Comprobar de nuevo', step: '6 s hasta ahora · suele tardar unos 1 min', late: 'está tardando más de lo habitual', blocked: 'Conduict cannot reach the machine.', checked: 'Comprobado hace 3 min', known: /^Último estado conocido: En marcha · \d\d:\d\d$/, copied: 'Copiado', refused: 'No se pudo copiar', summary: 'Detalles técnicos', leaving: 'Cerrando sesión…', signout: 'Cerrar sesión en Beyond' }
};

const open = (browser, consumer, query = '?at=0.5', options = {}) => browser.open(consumer, { file: 'operations.html', query, ...options });

const card = page =>
	page.evaluate(() => {
		const node = document.querySelector('.bui-awaited');
		const bar = node.querySelector('progress');
		return {
			state: node.dataset.state,
			time: node.querySelector('.bui-awaited-time').textContent,
			bar: bar.hidden || !bar.getClientRects().length ? 'hidden' : bar.hasAttribute('value') ? Number(bar.value.toFixed(3)) : 'indeterminate',
			again: Boolean(node.querySelector('.bui-awaited-actions:not([hidden]) button')),
			step: node.querySelector('.bui-step[data-state="progress"] .bui-step-time')?.textContent ?? null,
			said: node.querySelector(':scope > .bui-announcer').textContent,
			body: node.querySelector('.bui-awaited-body').textContent
		};
	});

const visible = page => page.evaluate(() => [...document.querySelectorAll('.bui-tooltip')].filter(node => !node.hidden && node.getClientRects().length).map(node => [node.textContent, node.getAttribute('aria-hidden')]));

export const checks = [
	{
		name: 'awaited card: time left of the median, then of the 90th percentile, slow past it by the clock alone, the same after a reload',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const said = words[consumer.language];
			const { page } = await open(browser, consumer);
			const first = await card(page);
			expect(first.time === said.left && first.state === 'progress' && first.bar > 0 && first.bar < 0.9 && !first.again, `at 0.5 min: ${JSON.stringify(first)}`);
			expect(first.step === said.step, `the startup step: ${first.step}`);
			await page.reload();
			await page.waitForFunction(() => window.fixture?.ready && document.querySelector('.bui-awaited'));
			const again = await card(page);
			expect(JSON.stringify(again) === JSON.stringify(first), `a reload shows the same: ${JSON.stringify(again)}`);
			await page.evaluate(() => window.fixture.at(1.5));
			expect((await card(page)).time === said.brief, 'under a minute left');
			await page.evaluate(() => window.fixture.at(2));
			let found = await card(page);
			expect(found.time === said.left && found.state === 'late' && found.bar === 0.9 && !found.again, `at the median: ${JSON.stringify(found)}`);
			await page.evaluate(() => window.fixture.at(4));
			found = await card(page);
			expect(found.state === 'late' && !found.said, `at the 90th percentile it is not slow: ${JSON.stringify(found)}`);
			await page.evaluate(() => window.fixture.at(4.1));
			found = await card(page);
			expect(found.state === 'slow' && found.time === said.slow && found.bar === 'indeterminate' && found.again, `past the 90th percentile: ${JSON.stringify(found)}`);
			expect(found.said.includes(said.late), `announced politely: ${found.said}`);
			const live = await page.evaluate(() => [...document.querySelectorAll('.bui-awaited .bui-announcer')].map(node => node.getAttribute('aria-live')));
			expect(live.every(value => value === 'polite') && live.length === 2, `the card's and the steps' live regions are polite: ${live}`);
		}
	},
	{
		name: 'awaited card: Check again runs once and shows it; the reason replaces the time; the end completes the bar; no motion under reduced motion',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const said = words[consumer.language];
			const { page, context } = await open(browser, consumer, '?at=5');
			const button = page.locator('.bui-awaited-actions button');
			expect((await button.innerText()).trim() === said.check, 'Check again');
			await button.click();
			await button.click({ force: true });
			expect((await button.getAttribute('aria-disabled')) === 'true' && (await button.locator('.bui-spinner').count()) === 1, 'it shows it is running');
			expect((await page.evaluate(() => window.fixture.log.filter(entry => entry === 'check').length)) === 1, 'one check at a time');
			await page.evaluate(() => window.fixture.release());
			await page.waitForFunction(() => document.querySelector('.bui-awaited').dataset.state === 'stalled');
			const found = await card(page);
			expect(found.time === '' && found.bar === 'hidden' && found.said.includes(said.blocked), `the reason in place of the time: ${JSON.stringify(found)}`);
			expect(await page.locator('.bui-awaited-reason details.bui-details').count() === 1, 'its technical details');
			await page.evaluate(() => window.fixture.end('done'));
			await page.waitForFunction(() => document.querySelector('.bui-awaited').dataset.state === 'done');
			expect((await card(page)).bar === 1 && (await page.evaluate(() => window.fixture.log.includes('end:done'))), 'the bar completes and onend runs');
			await context.close();
			for (const reducedMotion of ['no-preference', 'reduce']) {
				const view = await open(browser, consumer, '?at=5', { reducedMotion });
				const moving = await view.page.evaluate(() => [document.querySelector('.bui-awaited progress'), document.querySelector('.bui-awaited-mark .bui-spinner'), document.querySelector('.bui-step-ring')].map(node => node?.getAnimations().length ?? 0));
				if (reducedMotion === 'reduce') expect(moving.every(count => count === 0), `nothing moves: ${moving}`);
				else expect(moving[0] > 0 && moving[1] > 0, `the bar and the spinner move: ${moving}`);
				await view.context.close();
			}
		}
	},
	{
		name: 'freshness keeps "checked … ago" current and says the last known state while disconnected; technical details copy everything or say the refusal',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const said = words[consumer.language];
			const { page, context } = await open(browser, consumer, '?at=0');
			await page.evaluate(() => window.fixture.at(3));
			const [live, lost] = await page.evaluate(() => ['#live', '#lost'].map(selector => document.querySelector(`${selector} .bui-freshness-age`)?.textContent + '|' + document.querySelector(`${selector} .bui-freshness-state`).textContent));
			expect(live.startsWith(said.checked), `live: ${live}`);
			expect(said.known.test(lost.split('|')[1]) && lost.startsWith('|'), `last known, no age: ${lost}`);
			const summary = page.locator('main > .bui-host > details, main > details').first().locator('summary');
			expect((await summary.innerText()).trim() === said.summary, 'Technical details');
			await summary.focus();
			await page.keyboard.press('Enter');
			const copy = page.locator('main > .bui-host > details, main > details').first().locator('.bui-details-actions button');
			if (browser.engine === 'chrome') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
			else await page.evaluate(() => (navigator.clipboard.writeText = async text => void (window.copied = text)));
			await copy.click();
			await page.waitForFunction(() => document.querySelector('.bui-details-result').textContent);
			const copied = browser.engine === 'chrome' ? await page.evaluate(() => navigator.clipboard.readText()) : await page.evaluate(() => window.copied);
			expect(/i\/o timeout\n.+: req_7Hq2\n.+: 2026-10-03T19:50:00\.000Z/.test(copied), `the words, the request and the time: ${JSON.stringify(copied)}`);
			expect((await page.locator('.bui-details-result').first().innerText()).trim() === said.copied, 'said in place');
			await page.evaluate(() => (navigator.clipboard.writeText = () => Promise.reject(new Error('NotAllowedError'))));
			await copy.click();
			await page.waitForFunction(text => document.querySelector('.bui-details-result').textContent.startsWith(text), said.refused);
			expect((await page.evaluate(() => String(getSelection()))).includes('req_7Hq2'), 'the text is selected for the keyboard');
		}
	},
	{
		name: 'cut names (D44): the bar\'s and a select\'s chosen name whole on hover and keyboard focus, none for a name that fits, whole in the open menu',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, '?at=0', { viewport: { width: 1024, height: 800 } });
			const button = page.locator('.bui-family-wide [data-part="project"] .bui-navmenu-button');
			const cut = await button.evaluate(node => {
				const place = node.querySelector('.bui-family-place');
				return place.scrollWidth > place.clientWidth;
			});
			expect(cut, 'the project name is cut at 1024 px');
			await page.keyboard.press('Tab');
			await button.focus();
			let shown = await visible(page);
			expect(shown.length === 1 && shown[0][0] === 'Storefront redesign for the spring catalogue' && shown[0][1] === 'true', `on focus: ${JSON.stringify(shown)}`);
			await page.locator('h1').hover();
			await page.locator('h1').click();
			await page.waitForFunction(() => ![...document.querySelectorAll('.bui-tooltip')].some(node => !node.hidden));
			await button.hover();
			await page.waitForFunction(() => [...document.querySelectorAll('.bui-tooltip')].some(node => !node.hidden));
			await button.click();
			shown = await visible(page);
			expect(!shown.length, `no tooltip over the open menu: ${JSON.stringify(shown)}`);
			const row = await page.evaluate(() => {
				const label = [...document.querySelectorAll('.bui-family-wide [data-part="project"] .bui-navmenu-label')].find(node => node.textContent.startsWith('Storefront redesign'));
				return { text: label.textContent, whole: label.scrollWidth <= label.clientWidth + 1 };
			});
			expect(row.text === 'Storefront redesign for the spring catalogue' && row.whole, `whole in the menu: ${JSON.stringify(row)}`);
			await page.keyboard.press('Escape');
			await page.locator('#long').focus();
			shown = await visible(page);
			expect(shown.length === 1 && shown[0][0] === 'Storefront redesign for the spring catalogue', `the select's cut name: ${JSON.stringify(shown)}`);
			await page.locator('#short').focus();
			expect(!(await visible(page)).length, 'a chosen name that fits shows none');
		}
	},
	{
		name: 'sign out of Beyond: ends the product session, says it is working, ignores a second press and goes to /leave; before() cancels; a silent end() is bounded',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const said = words[consumer.language];
			const { page, context } = await open(browser, consumer, '?at=0&project=prj_shop&dialog=rename');
			const from = page.url();
			const menu = page.locator('[data-part="account"] .bui-navmenu-button');
			const entry = page.locator('.bui-family-signout');
			await menu.click();
			expect((await entry.innerText()).trim() === said.signout, `the label: ${await entry.innerText()}`);
			const leaving = page.waitForURL(/\/leave\.html\?/, { timeout: 5000 });
			await entry.click();
			expect((await entry.innerText()).trim() === said.leaving && (await entry.getAttribute('aria-disabled')) === 'true', 'it says it is working');
			expect((await menu.getAttribute('aria-expanded')) === 'true', 'the menu stays open');
			await entry.click({ force: true });
			await leaving;
			const url = new URL(page.url());
			const back = new URL(from);
			back.searchParams.delete('dialog');
			expect(url.searchParams.get('product') === 'delegate' && url.searchParams.get('return') === back.href, `to /leave with the way back: ${url.href}`);
			await context.close();
			const cancel = await open(browser, consumer, '?at=0&signout=cancel');
			await cancel.page.locator('[data-part="account"] .bui-navmenu-button').click();
			await cancel.page.locator('.bui-family-signout').click();
			await cancel.page.waitForTimeout(500);
			expect(!cancel.page.url().includes('/leave') && (await cancel.page.evaluate(() => window.fixture.log.join('|'))) === 'before', 'before() said no: nothing ended, nothing left');
			await cancel.context.close();
			const silent = await open(browser, consumer, '?at=0&signout=silent');
			await silent.page.locator('[data-part="account"] .bui-navmenu-button').click();
			const started = Date.now();
			await silent.page.locator('.bui-family-signout').click();
			await silent.page.waitForURL(/\/leave\.html\?/, { timeout: 5000 });
			expect(Date.now() - started >= 350, 'it waited for the bound, then left');
			await silent.context.close();
		}
	}
];
