import { expect, overflow } from '../support/browser.mjs';
import { survey } from '../../tests/support/names.mjs';

/** "Choose, never type" (0.7.0) in a real engine: the side sheet, the resource picker, the ref chooser, column priority and list-detail, and a provider's window. */
async function open(browser, consumer, { width = 1440, height = 900, query = '', scheme = 'light' } = {}) {
	const view = await browser.open(consumer, { file: 'choosing.html', query, viewport: { width, height }, colorScheme: scheme });
	await view.page.waitForSelector('#listing table', { state: 'attached' });
	return view;
}

const inside = page => page.evaluate(() => Boolean(document.activeElement?.closest('.bui-sheet')));
const log = page => page.evaluate(() => window.fixture.log.join('|'));
const copy = consumer => (consumer.language === 'es' ? { add: 'Añadir 1 repositorio', open: 'Añadir repositorios', selected: '1 elegido', ref: 'Usar un commit u otra referencia…', continue: 'Continuar en GitHub' } : { add: 'Add 1 repository', open: 'Add repositories', selected: '1 selected', ref: 'Use a commit or another ref…', continue: 'Continue to GitHub' });

export const checks = [
	{
		name: 'choose: side sheet: at the inline end, the window\'s height, 40rem wide from 1024 px and whole below; focus kept inside and returned; busy and a press outside never close it; both themes',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const words = copy(consumer);
			const surfaces = {};
			for (const [width, scheme] of [[1440, 'light'], [1023, 'dark'], [390, 'light'], [320, 'dark']]) {
				const at = `${width}px ${scheme}`;
				const { page, context } = await open(browser, consumer, { width, scheme });
				const opener = page.locator('#sheeting > .bui-button, #sheeting > button').first();
				await opener.click();
				await page.waitForFunction(() => document.querySelector('.bui-sheet')?.open);
				// The sheet slides in; it is measured where it rests.
				await page.waitForFunction(() => document.querySelector('.bui-sheet').getAnimations().every(animation => animation.playState === 'finished'));
				const box = await page.evaluate(() => {
					const rect = document.querySelector('.bui-sheet').getBoundingClientRect();
					return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, view: innerWidth, height: innerHeight, surface: getComputedStyle(document.querySelector('.bui-sheet')).backgroundColor };
				});
				surfaces[scheme] = box.surface;
				expect(Math.abs(box.right - box.view) <= 1 && Math.abs(box.top) <= 1 && Math.abs(box.bottom - box.height) <= 1, `${at}: at the inline end, the window's height: ${JSON.stringify(box)}`);
				const expected = width >= 1024 ? 640 : box.view;
				expect(Math.abs(box.width - expected) <= 1, `${at}: ${box.width} px wide, expected ${expected}`);
				expect(!(await overflow(page)), `${at}: no sideways scroll`);
				expect(await inside(page), `${at}: focus starts inside the sheet`);
				for (let index = 0; index < 25; index += 1) {
					await page.keyboard.press(index % 5 === 4 ? 'Shift+Tab' : 'Tab');
					expect(await inside(page), `${at}: Tab ${index} left the sheet`);
				}
				await page.mouse.click(5, box.height / 2);
				expect(await page.evaluate(() => document.querySelector('.bui-sheet').open) || width < 1024, `${at}: a press outside never closes it`);
				await page.getByRole('button', { name: words.add }).click();
				await page.keyboard.press('Escape');
				expect(await page.evaluate(() => document.querySelector('.bui-sheet')?.open), `${at}: busy holds it open`);
				await page.getByRole('button', { name: words.add }).click();
				await page.keyboard.press('Escape');
				await page.waitForFunction(() => !document.querySelector('.bui-sheet')?.open);
				const back = await page.evaluate(() => document.activeElement?.closest('#sheeting') !== null && document.activeElement.tagName === 'BUTTON');
				expect(back, `${at}: focus returns to the button that opened it`);
				expect((await log(page)).includes('sheet:null'), `${at}: Escape is a dismissal`);
				await context.close();
			}
			expect(surfaces.light !== surfaces.dark, `the sheet's surface follows the theme: ${JSON.stringify(surfaces)}`);
		}
	},
	{
		name: 'choose: resource picker: a pasted address is chosen, the account changes by keyboard, and "Can\'t find it?" stays in a no-match state at 320 px',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const words = copy(consumer);
			const { page } = await open(browser, consumer, { width: 320 });
			const combobox = page.locator('#picking [role="combobox"]');
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 4);
			await combobox.fill('https://github.com/acme/api.git');
			await page.waitForFunction(() => window.fixture.log.some(entry => entry === 'recognized:acme/api:picked'));
			const counted = await page.locator('#picking .bui-picker-count').textContent();
			expect(counted.includes(words.selected), `the pasted repository is chosen: ${counted}`);
			const from = page.locator('#picking .bui-picker-from .bui-choice-button');
			await from.focus();
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			await combobox.fill('');
			await page.waitForFunction(() => window.fixture.log.includes('source:con_ada:'));
			await page.waitForFunction(() => [...document.querySelectorAll('#picking [role="option"]')].map(node => node.textContent).join() .includes('ada-gh/notes'));
			await combobox.fill('zzz');
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 0 && document.querySelector('#picking [role="listbox"]').getAttribute('aria-busy') === 'false');
			expect(await page.locator('#picking .bui-picker-escape').isVisible(), '"Can\'t find it?" in the no-match state');
			expect(!(await overflow(page)), 'no sideways scroll at 320 px');
		}
	},
	{
		name: 'choose: ref chooser: the keys search a long list, Enter chooses; the escape field checks Git\'s rules; the project picker explains a denied project',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const words = copy(consumer);
			const { page } = await open(browser, consumer);
			await page.locator('#refs .bui-choice-button').focus();
			await page.keyboard.press('ArrowDown');
			expect(await page.evaluate(() => document.activeElement.classList.contains('bui-choice-field')), 'a long list opens on its search field');
			await page.keyboard.type('login');
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.includes('ref:feature/login-page'));
			await page.locator('#refs .bui-choice-button').click();
			await page.getByRole('menuitem', { name: words.ref }).click();
			await page.keyboard.type('bad name');
			await page.keyboard.press('Enter');
			expect(await page.locator('#refs .bui-field-error').isVisible(), 'a ref with a space is refused in place');
			await page.locator('#refs .bui-refs-other input').fill('4f2a9c1');
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.includes('ref:4f2a9c1'));
			await page.locator('#projects .bui-choice-button').click();
			const denied = page.locator('#projects [role="menuitemradio"][aria-disabled="true"]');
			expect((await denied.count()) === 1 && /Delegate/.test(await denied.textContent()), 'the denied project says why');
			await page.keyboard.press('Escape');
		}
	},
	{
		name: 'choose: collection and list-detail: columns leave by priority as the region narrows and come back; rows stack below 640 px; the detail beside its list on a wide region, alone on a narrow one',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const words = copy(consumer);
			const hidden = page => page.evaluate(() => [...document.querySelectorAll('#listing thead th')].filter(cell => cell.hasAttribute('data-bui-hidden')).length);
			let view = await open(browser, consumer, { width: 1440 });
			expect((await hidden(view.page)) === 0, 'every column at 1440 px');
			await view.context.close();
			view = await open(browser, consumer, { width: 760 });
			const count = await hidden(view.page);
			expect(count > 0, 'columns leave in a 760 px window');
			const toggle = view.page.locator('#listing .bui-collection-columns');
			expect((await toggle.textContent()).includes(String(count)), `the reveal names how many: ${await toggle.textContent()}`);
			await toggle.click();
			expect((await hidden(view.page)) === 0 && !(await overflow(view.page)), 'revealed, the table scrolls in its own box');
			await view.page.setViewportSize({ width: 600, height: 900 });
			await view.page.waitForFunction(() => getComputedStyle(document.querySelector('#listing table')).display === 'block');
			await view.context.close();
			view = await open(browser, consumer, { width: 1600, query: '?detail=1' });
			const wide = await view.page.evaluate(() => ({ list: document.querySelector('.bui-listdetail-list').getBoundingClientRect().toJSON(), detail: document.querySelector('.bui-listdetail-detail').getBoundingClientRect().toJSON(), back: getComputedStyle(document.querySelector('.bui-listdetail-back')).display }));
			expect(wide.detail.left >= wide.list.right - 1 && wide.list.width > 0 && wide.back === 'none', `beside the list on a wide region: ${JSON.stringify(wide)}`);
			await view.context.close();
			view = await open(browser, consumer, { width: 800, query: '?detail=1' });
			const narrow = await view.page.evaluate(() => ({ list: document.querySelector('.bui-listdetail-list').getClientRects().length, back: document.querySelector('.bui-listdetail-link')?.getClientRects().length ?? 0 }));
			expect(narrow.list === 0 && narrow.back === 1, `alone with its way back on a narrow region: ${JSON.stringify(narrow)}`);
			await view.context.close();
		}
	},
	{
		name: 'choose: provider window: the stand-in provider\'s window finishes and the page reads the outcome; icon-only controls are named',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const words = copy(consumer);
			const { page, context } = await open(browser, consumer, { query: '?sheet=1' });
			const controls = await page.evaluate(survey, true);
			for (const control of controls.filter(item => item.bare)) expect(control.name && control.hint, `icon-only ${control.describe} is named with a tooltip`);
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => !document.querySelector('.bui-sheet')?.open);
			const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: words.continue }).click()]);
			await popup.waitForLoadState();
			await popup.locator('#finish').click();
			await page.waitForFunction(() => window.fixture.log.includes('provider:done'), null, { timeout: 10_000 });
		}
	},
	{
		name: 'choose: a stated option keeps its hint and state, and a row\'s one-line wait wraps without cutting, at 320 and 1440 px in both themes',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const [width, scheme] of [[320, 'dark'], [1440, 'light']]) {
				const at = `${width}px ${scheme}`;
				const { page, context } = await open(browser, consumer, { width, scheme });
				const found = await page.evaluate(() => {
					const output = document.querySelector('#following .bui-statement output');
					const hint = document.getElementById(output.getAttribute('aria-describedby'));
					const line = document.querySelector('#following .bui-line');
					const box = node => node.getBoundingClientRect();
					return { hint: hint?.textContent ?? '', below: hint ? box(hint).top >= box(output).bottom - 1 : false, state: document.querySelector('#following .bui-statement .bui-status')?.textContent ?? '', line: line.textContent, right: box(line).right, view: innerWidth };
				});
				expect(found.hint.length > 20 && found.below, `${at}: the hint describes the statement on its own line: ${JSON.stringify(found)}`);
				expect(/Ready|Listo/.test(found.state), `${at}: the state is kept: ${found.state}`);
				expect(/40 s|41 s|42 s/.test(found.line) && /1 min/.test(found.line), `${at}: the line says the time so far and the usual time: ${found.line}`);
				expect(found.right <= found.view && !(await overflow(page)), `${at}: the line stays inside the page`);
				await context.close();
			}
		}
	},
	{
		name: 'choose: a confirmation states the work it affects and what keeps costing, in order, in the page\'s language, starting on Cancel',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 390 });
			await page.locator('#consequence button').click();
			await page.waitForSelector('dialog[open] .bui-consequence');
			const terms = await page.locator('dialog[open] .bui-consequence dt').allTextContents();
			const expected = consumer.language === 'es' ? ['Trabajo afectado', 'Lo que se pierde', 'Qué sigue costando', 'Cómo deshacerlo'] : ['Work it affects', 'What is lost', 'What keeps costing', 'How to undo'];
			expect(JSON.stringify(terms) === JSON.stringify(expected), `terms ${JSON.stringify(terms)}`);
			const start = await page.evaluate(() => document.activeElement.textContent);
			expect(start === (consumer.language === 'es' ? 'Cancelar' : 'Cancel'), `a danger starts on Cancel: ${start}`);
			expect(!(await overflow(page)), 'no sideways scroll at 390 px');
			await page.keyboard.press('Escape');
			await page.waitForFunction(() => window.fixture.log.includes('confirm:false'));
		}
	}
];

