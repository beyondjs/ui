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

/**
 * Runs in the page before its scripts (an init script): every frame until the inbox's rows arrive, whether its
 * region's wait is drawn, when it was first drawn and first seen, and how it was at birth.
 */
function frames() {
	const record = (window.inboxFrames = { born: null, seen: null, most: 0, birth: null, done: false });
	const watch = () => {
		const wait = document.querySelector('#inbox .bui-waiting');
		if (wait) {
			const opacity = Number(getComputedStyle(wait).opacity);
			if (record.born === null) {
				record.born = performance.now();
				record.birth = { busy: wait.closest('[aria-busy="true"]') !== null, announced: wait.querySelector('[role="status"]')?.textContent ?? null, opacity, line: document.querySelector('#inbox .bui-loading') !== null };
			}
			if (opacity > 0 && record.seen === null) record.seen = performance.now();
			record.most = Math.max(record.most, opacity);
		}
		if (document.querySelector('#inbox .bui-notice')) record.done = true;
		else requestAnimationFrame(watch);
	};
	requestAnimationFrame(watch);
}

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
	},
	{
		name: 'the inbox’s first read: the shared wait in the list’s place, unseen for its grace; a quick answer never shows it, and a filter’s read says its loading line at once (0.44.0, D185)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			let view = await browser.open(consumer, { query: '?notices=slow&delay=900', prepare: context => context.addInitScript(frames) });
			const slow = await view.page.waitForFunction(() => window.inboxFrames?.done && window.inboxFrames).then(handle => handle.jsonValue());
			expect(slow.born !== null && slow.birth.busy && slow.birth.announced && slow.birth.opacity === 0 && !slow.birth.line, `in place, busy and announced, unseen, with no loading line: ${JSON.stringify(slow)}`);
			expect(slow.seen !== null && slow.seen - slow.born >= 280, `seen only past its grace: ${JSON.stringify(slow)}`);
			expect((await view.page.locator('#inbox .bui-waiting').count()) === 0, 'the answer replaces the wait');
			await view.page.locator('#inbox .bui-toggle').nth(1).click();
			const line = await view.page.evaluate(() => {
				const loading = document.querySelector('#inbox .bui-loading');
				return { line: loading !== null, opacity: loading ? Number(getComputedStyle(loading).opacity) : null, wait: document.querySelector('#inbox .bui-waiting') !== null };
			});
			expect(line.line && line.opacity === 1 && !line.wait, `the person’s own read says so at once: ${JSON.stringify(line)}`);
			await view.context.close();
			view = await browser.open(consumer, { query: '?notices=slow&delay=120', prepare: context => context.addInitScript(frames) });
			const quick = await view.page.waitForFunction(() => window.inboxFrames?.done && window.inboxFrames).then(handle => handle.jsonValue());
			expect(quick.born !== null && quick.most === 0, `a quick answer never shows the wait: ${JSON.stringify(quick)}`);
			await view.context.close();
		}
	}
];
