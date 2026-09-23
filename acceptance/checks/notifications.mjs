import { expect } from '../support/browser.mjs';
import { words } from '../support/words.mjs';

const bell = page => page.locator('.bui-notify > button');
const panel = page => page.locator('.bui-notify .bui-disclosure-panel');

/** The notification entry and inbox with the fixture adapter in each of its modes. */
export const checks = [
	{
		name: 'entry: unread count and name, panel lists and marks read, Escape returns focus and the panel forgets its items',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			await page.locator('.bui-notify .bui-count:not([hidden])').waitFor();
			expect(await page.locator('.bui-notify .bui-count').textContent() === '4', 'four unread');
			expect((await bell(page).getAttribute('aria-label')).includes('4'), 'the accessible name says the count');
			await bell(page).click();
			await panel(page).locator('.bui-notice').first().waitFor();
			await panel(page).getByRole('button', { name: copy.markRead }).first().click();
			await page.waitForFunction(() => document.querySelector('.bui-notify .bui-count').textContent === '3');
			await page.keyboard.press('Escape');
			expect(await page.evaluate(() => document.activeElement.closest('.bui-notify') && document.activeElement.getAttribute('aria-expanded') === 'false'), 'focus back on the bell');
			expect(await panel(page).locator('.bui-notice').count() === 0, 'no item text kept after closing');
		}
	},
	{
		name: 'entry and inbox state unavailable, failure with retry, partial results and empty',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			let view = await browser.open(consumer, { query: '?notices=unavailable' });
			await view.page.locator('#inbox', { hasText: copy.unavailable }).waitFor();
			expect(await view.page.locator('.bui-notify .bui-count').isHidden(), 'no count while unavailable');
			await bell(view.page).click();
			await panel(view.page).getByText(copy.unavailable).waitFor();
			await view.context.close();
			view = await browser.open(consumer, { query: '?notices=failed' });
			await bell(view.page).click();
			await panel(view.page).getByRole('button', { name: copy.retry }).waitFor();
			expect(await view.page.locator('.bui-notify .bui-count').isHidden(), 'no count after a failure');
			await view.page.evaluate(() => window.fixture.notices.recover());
			await panel(view.page).getByRole('button', { name: copy.retry }).click();
			await panel(view.page).locator('.bui-notice').first().waitFor();
			await view.context.close();
			view = await browser.open(consumer, { query: '?notices=partial' });
			await view.page.locator('#inbox', { hasText: copy.partial }).waitFor();
			const inbox = await view.page.locator('#inbox').textContent();
			expect(!inbox.includes('1.4.0'), 'hidden product items are not shown');
			expect(inbox.includes(copy.named) && !inbox.includes('(cdn)'), `the unreachable product is named by its display name: ${inbox.slice(0, 200)}`);
			await bell(view.page).click();
			await panel(view.page).getByText(copy.partial).waitFor();
			expect((await panel(view.page).textContent()).includes(copy.named), 'the panel names it too');
			await view.context.close();
			view = await browser.open(consumer, { query: '?notices=empty' });
			await bell(view.page).click();
			await panel(view.page).getByText(copy.empty).waitFor();
			await view.context.close();
		}
	},
	{
		name: 'entry: a count that stopped at the summary bound reads N+ and says so',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer, { query: '?notices=bound' });
			const copy = words[consumer.language];
			await page.locator('.bui-notify .bui-count:not([hidden])').waitFor();
			const shown = await page.locator('.bui-notify .bui-count').textContent();
			expect(shown === '2+', `bounded count: ${shown}`);
			const name = await bell(page).getAttribute('aria-label');
			expect(name.includes('2') && name.includes(copy.bound), `the accessible name says it is a lower bound: ${name}`);
		}
	},
	{
		name: 'entry: View all closes the panel, returns focus to the bell and routes to the inbox',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			await bell(page).click();
			await panel(page).locator('.bui-notice').first().waitFor();
			await panel(page).getByRole('link', { name: copy.view }).click();
			await page.waitForFunction(() => location.hash === '#/notifications');
			expect(!(await panel(page).isVisible()), 'the panel closed');
			expect(await page.evaluate(() => document.activeElement === document.querySelector('.bui-notify > button')), 'focus is on the bell');
			if (consumer.language !== 'es') return;
			await bell(page).click();
			await panel(page).locator('.bui-notice-open').first().focus();
			await page.evaluate(() => window.fixture.entry.current.close());
			expect(!(await panel(page).isVisible()), 'React closes the panel through the ref');
			expect(await page.evaluate(() => document.activeElement === document.querySelector('.bui-notify > button')), 'focus inside the panel returned to the bell');
		}
	},
	{
		name: 'opening an item navigates to the destination the adapter returned',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			await bell(page).click();
			await panel(page).locator('.bui-notice-open').first().click();
			await page.waitForFunction(() => location.hash === '#/opened/n1');
			expect(!(await panel(page).isVisible()), 'the panel closes when an item opens');
		}
	},
	{
		name: 'inbox: unread and all, load more, expand a group',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await browser.open(consumer);
			const copy = words[consumer.language];
			const inbox = page.locator('#inbox');
			await inbox.locator('.bui-notice').first().waitFor();
			expect(await inbox.locator('.bui-inbox-body > .bui-notices > .bui-notice').count() === 3, 'three unread entries (one group of two)');
			await inbox.locator('[data-control="group"]').click();
			expect(await inbox.locator('.bui-notice-earlier').isVisible(), 'the earlier update is revealed');
			await inbox.getByRole('button', { name: copy.all, exact: true }).click();
			await page.waitForFunction(() => document.querySelectorAll('#inbox .bui-notice').length >= 10);
			await inbox.getByRole('button', { name: copy.loadMore }).click();
			await page.waitForFunction(() => document.querySelectorAll('#inbox .bui-notice').length >= 20);
			expect(await inbox.getByRole('button', { name: copy.all, exact: true }).getAttribute('aria-pressed') === 'true', 'the filter shows its state');
			const log = await page.evaluate(() => window.fixture.log);
			expect(log.some(entry => entry.startsWith('inbox:') && entry.includes('"all"')), 'the state change is reported for the address');
		}
	}
];
