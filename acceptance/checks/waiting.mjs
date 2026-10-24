import { expect } from '../support/browser.mjs';

/**
 * A region's wait shows only when its read is slow (0.31.0, D185), measured in the browser: drawn in place,
 * busy and announced at once, unseen for its 300 ms grace, then faded in with opacity alone; under reduced
 * motion it appears at the grace with no fading. Nothing delays the content: the fixture's region never
 * answers, so what is measured is the wait itself.
 */
async function open(browser, consumer, motion) {
	const view = await browser.open(consumer, { file: 'hold.html', reducedMotion: motion });
	await view.page.evaluate(() => window.fixture.wait());
	await view.page.waitForFunction(() => document.querySelector('.bui-waiting'));
	return view;
}

/** The newest wait: whether it is busy and announced, how much of it is seen and its one animation's timing */
const measure = page =>
	page.evaluate(() => {
		const wait = [...document.querySelectorAll('.bui-waiting')].at(-1);
		const motions = wait.getAnimations();
		const timing = motions[0]?.effect.getTiming();
		return {
			busy: wait.closest('[aria-busy="true"]') !== null,
			announced: wait.querySelector('[role="status"]')?.textContent ?? null,
			opacity: Number(getComputedStyle(wait).opacity),
			motions: motions.map(motion => motion.animationName),
			delay: timing?.delay ?? null,
			duration: timing?.duration ?? null,
			placeholders: wait.querySelectorAll('.bui-skeleton').length && wait.querySelector('.bui-skeleton').getAnimations().length
		};
	});

export const checks = [
	{
		name: 'a region’s wait: in place, busy and announced at once, unseen for its 300 ms grace, then faded in (D185)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, 'no-preference');
			const first = await measure(page);
			expect(first.busy && first.announced && first.opacity === 0, `at once it is busy and announced, and unseen: ${JSON.stringify(first)}`);
			expect(first.motions.join() === 'bui-waiting-in' && first.delay === 300 && first.duration === 200, `one fade in after its grace: ${JSON.stringify(first)}`);
			expect(first.placeholders === 0, `its placeholders are not graced a second time: ${JSON.stringify(first)}`);
			await page.waitForFunction(() => Number(getComputedStyle([...document.querySelectorAll('.bui-waiting')].at(-1)).opacity) === 1, null, { timeout: 2000 });
		}
	},
	{
		name: 'a region’s wait under reduced motion: unseen for its grace, then shown at once, with no fading',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, 'reduce');
			const first = await measure(page);
			expect(first.opacity === 0 && first.delay === 300 && first.duration === 0, `unseen for its grace, then at once: ${JSON.stringify(first)}`);
			await page.waitForFunction(() => Number(getComputedStyle([...document.querySelectorAll('.bui-waiting')].at(-1)).opacity) === 1, null, { timeout: 2000 });
		}
	}
];
