import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

const count = page => page.locator('#picking .bui-picker-count').textContent();
const options = page => page.locator('#picking [role="option"]');

/** The searchable entity picker in a real browser. */
export const checks = [
	{
		name: 'picker: choices survive paging, a filter and a new query, and are counted with the stale one',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 20);
			await options(page).nth(0).click();
			await page.locator('#picking').getByRole('button', { name: copy.loadMore }).click();
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 40);
			await options(page).nth(30).click();
			await page.locator('#picking select').selectOption('support');
			await page.waitForFunction(() => [...document.querySelectorAll('#picking [role="option"]')].every(node => /Support/.test(node.textContent)) && document.querySelector('#picking [role="listbox"]').getAttribute('aria-busy') === 'false');
			// The first Support person is disabled with a reason; the second can be chosen.
			await options(page).nth(1).click();
			const combobox = page.locator('#picking [role="combobox"]');
			await combobox.fill('Person 1');
			await page.waitForFunction(() => document.querySelector('#picking [role="listbox"]').getAttribute('aria-busy') === 'false' && document.querySelectorAll('#picking [role="option"]').length < 20);
			const text = await count(page);
			expect(text.includes(`4 ${copy.selected}`), `four chosen including the stale one, got “${text}”`);
			const inputs = await page.locator('#picking input[type="hidden"]').evaluateAll(nodes => nodes.map(node => node.value));
			expect(inputs.length === 4 && inputs.includes('p1') && inputs.includes('p31') && inputs.includes('gone'), `hidden inputs ${inputs}`);
		}
	},
	{
		name: 'picker: "all" adds every result shown that can be chosen, then leaves until more are shown',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 20);
			const all = page.locator('#picking').getByRole('button', { name: copy.pickAll });
			await all.click();
			// The 19 enabled results shown (Person 03 is disabled) and the stale choice the page starts with.
			const text = await count(page);
			expect(text.includes(`20 ${copy.selected}`), `twenty chosen, got “${text}”`);
			expect(!(await all.isVisible()), 'nothing left to add among the results shown');
			expect(await page.evaluate(() => document.activeElement?.getAttribute('role')) === 'combobox', 'focus returns to the search field');
			await page.locator('#picking').getByRole('button', { name: copy.loadMore }).click();
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 40);
			await all.waitFor();
			const log = await page.evaluate(() => window.fixture.log);
			expect(log.includes('picked:20'), `one change for the whole addition, log ${log}`);
		}
	},
	{
		name: 'picker: no matches is stated; a failing source offers retry and recovers',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const combobox = page.locator('#picking [role="combobox"]');
			await combobox.fill('nobody at all');
			await page.locator('#picking .bui-picker-status', { hasText: copy.noMatch }).waitFor();
			await page.evaluate(() => (window.fixture.people.fail = true));
			await combobox.fill('Person');
			await page.locator('#picking .bui-picker-status', { hasText: copy.pickerFailure }).waitFor();
			await page.evaluate(() => (window.fixture.people.fail = false));
			await page.locator('#picking').getByRole('button', { name: copy.retry }).click();
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length > 0);
			expect(!(await page.locator('#picking').getByRole('button', { name: copy.retry }).isVisible()), 'retry disappears after recovery');
		}
	},
	{
		name: 'picker keyboard: arrows move the active option, Enter chooses, a disabled option explains and refuses',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			await page.waitForFunction(() => document.querySelectorAll('#picking [role="option"]').length === 20);
			const combobox = page.locator('#picking [role="combobox"]');
			await combobox.focus();
			for (let step = 0; step < 3; step++) await page.keyboard.press('ArrowDown');
			const active = await page.evaluate(() => document.getElementById(document.activeElement.getAttribute('aria-activedescendant'))?.textContent);
			expect(/Already in another batch/.test(active), `the active option is the disabled one and says why: ${active}`);
			await page.keyboard.press('Enter');
			expect(await options(page).nth(2).getAttribute('aria-selected') === 'false', 'a disabled option is not chosen');
			await page.keyboard.press('ArrowUp');
			await page.keyboard.press('Enter');
			expect(await options(page).nth(1).getAttribute('aria-selected') === 'true', 'Enter chooses the active option');
			expect(await page.evaluate(() => document.activeElement.getAttribute('role')) === 'combobox', 'focus stays in the search field');
		}
	}
];
