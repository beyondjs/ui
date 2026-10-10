import { expect } from '../support/browser.mjs';
import { open } from './anchoring.mjs';

/**
 * Motion of 0.14.0 in a real engine (D95): what the person opens or closes animates on entry and exit, a
 * pressed control never moves, a side panel's columns change once (the thread never reflows during its
 * motion), menus, the side sheet and inline disclosures leave as they came, and under reduced motion
 * nothing moves. `getAnimations()` is read right after each press; layout shifts without input are
 * counted where the engine reports them (Chrome).
 */
const moving = page => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => `${animation.effect?.target?.className ?? ''}${animation.effect?.pseudoElement ?? ''}:${animation.animationName ?? animation.transitionProperty ?? ''}`));
const frames = (page, count) => page.evaluate(count => new Promise(resolve => { const seen = []; const step = () => { seen.push(Math.round(document.querySelector('.bui-page-main').getBoundingClientRect().width)); if (seen.length >= count) resolve(seen); else requestAnimationFrame(step); }; requestAnimationFrame(step); }), count);
const shifts = page => page.evaluate(() => {
	window.fixtureShifts = 0;
	if (!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) return false;
	new PerformanceObserver(list => list.getEntries().forEach(entry => !entry.hadRecentInput && (window.fixtureShifts += entry.value))).observe({ type: 'layout-shift' });
	return true;
});

export const checks = [
	{
		name: 'the panel enters and leaves with transform and opacity, the pressed Details never moves, the thread’s width changes once (at the start opening, at the end closing), no unprompted layout shift',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1600, height: 900 });
			const observed = await shifts(page);
			const toggle = page.locator('.bui-page-header .bui-button', { hasText: 'Details' });
			const before = await toggle.boundingBox();
			const wide = await page.evaluate(() => Math.round(document.querySelector('.bui-page-main').getBoundingClientRect().width));
			await toggle.click();
			const leaving = await moving(page);
			expect(leaving.some(entry => entry.includes('bui-page-panel') && entry.includes('bui-panel-out')), `the panel leaves with its animation: ${leaving}`);
			const during = await frames(page, 3);
			expect(during.every(value => value === wide), `the thread keeps its width while the panel leaves: ${during} against ${wide}`);
			await page.waitForFunction(() => document.querySelector('.bui-page-panel').hidden);
			const after = await toggle.boundingBox();
			expect(Math.abs(after.x - before.x) < 1 && Math.abs(after.y - before.y) < 1, `the pressed toggle stays: ${JSON.stringify([before, after])}`);
			const alone = await page.evaluate(() => Math.round(document.querySelector('.bui-page-main').getBoundingClientRect().width));
			expect(alone > wide, `the columns changed at the end: ${wide} → ${alone}`);
			await toggle.click();
			const entering = await moving(page);
			expect(entering.some(entry => entry.includes('bui-panel-in')), `the panel enters with its animation: ${entering}`);
			const opened = await frames(page, 3);
			expect(opened.every(value => value === wide), `the columns changed at the start: ${opened} against ${wide}`);
			const again = await toggle.boundingBox();
			expect(Math.abs(again.x - before.x) < 1, 'the toggle stays when it opens too');
			if (observed) expect((await page.evaluate(() => window.fixtureShifts)) === 0, 'no layout shift without the person’s input');
		}
	},
	{
		name: 'a menu, the side sheet, an activity row and a disclosure leave as they came (D95); a live dot pulses about five seconds, then holds',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1600, height: 900 });
			const chip = page.locator('.bui-composer .bui-choice-button').first();
			await chip.click();
			await page.keyboard.press('Escape');
			const menu = await moving(page);
			expect(menu.some(entry => entry.includes('bui-leaving') && entry.includes('bui-leave')), `the menu leaves: ${menu}`);
			const row = page.locator('.bui-activity-head').first();
			// The pointer brings it into view first (Playwright scrolls to what it clicks); the press itself scrolls nothing
			await row.hover();
			const scrolled = await page.evaluate(() => window.scrollY);
			await row.click();
			const opening = await moving(page);
			expect(opening.some(entry => entry.includes('bui-activity-body')), `the row's body eases open: ${opening}`);
			await page.waitForTimeout(300);
			await row.click();
			const closing = await moving(page);
			// Its exit needs a transition of `display`, which Firefox does not run yet: there it closes at once
			if (browser.engine !== 'firefox') expect(closing.some(entry => entry.includes('bui-activity-body')), `and closed: ${closing}`);
			expect(scrolled === (await page.evaluate(() => window.scrollY)), 'nothing scrolls for the person');
			// A disclosure's content eases where the engine has ::details-content: its height where it interpolates to an
			// automatic size (Chrome), its opacity elsewhere. Engines do not list a ::details-content transition in
			// getAnimations(), so it is sampled.
			const eased = await page.evaluate(async () => {
				// Where the engine cannot read the pseudo-element's style (Firefox), its easing is not measured
				if (!CSS.supports('selector(::details-content)')) return null;
				const details = document.getElementById('more');
				const read = () => getComputedStyle(details, '::details-content');
				details.open = true;
				await new Promise(resolve => setTimeout(resolve, 40));
				const early = { height: parseFloat(read().height), opacity: parseFloat(read().opacity) };
				if (Number.isNaN(early.height)) return null;
				await new Promise(resolve => setTimeout(resolve, 400));
				return { early, late: { height: parseFloat(read().height), opacity: parseFloat(read().opacity) }, sized: CSS.supports('interpolate-size', 'allow-keywords') };
			});
			if (eased) expect(eased.early.opacity < 1 && eased.late.opacity === 1 && (!eased.sized || eased.early.height < eased.late.height), `a disclosure eases its content: ${JSON.stringify(eased)}`);
			const narrow = await open(browser, consumer, { width: 1000, height: 800 });
			await narrow.page.locator('.bui-page-header .bui-button', { hasText: 'Details' }).click();
			await narrow.page.waitForSelector('dialog.bui-sheet[open]');
			await narrow.page.waitForTimeout(250);
			await narrow.page.keyboard.press('Escape');
			const sheet = await moving(narrow.page);
			expect(sheet.some(entry => entry.includes('bui-sheet') && entry.includes('bui-sheet-out')), `the sheet slides out: ${sheet}`);
			await narrow.page.waitForFunction(() => !document.querySelector('.bui-leaving'));
			const pulses = await page.evaluate(() => [...document.styleSheets].flatMap(sheet => { try { return [...sheet.cssRules]; } catch { return []; } }).filter(rule => /bui-pulse/.test(rule.cssText) && !/@keyframes/.test(rule.cssText) && !/skeleton/.test(rule.selectorText)).map(rule => rule.style.animationIterationCount));
			expect(pulses.length && pulses.every(count => count === '4'), `live dots pulse four times (~5 s; a loading skeleton keeps pulsing): ${pulses}`);
		}
	},
	{
		name: 'under reduced motion nothing moves: the panel, a menu, the sheet and a row change at once',
		consumers: ['dom'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { width: 1600, height: 900, reducedMotion: 'reduce' });
			await page.locator('.bui-page-header .bui-button', { hasText: 'Details' }).click();
			expect((await moving(page)).length === 0, 'the panel at once');
			expect(await page.evaluate(() => document.querySelector('.bui-page-panel').hidden), 'hidden at once');
			await page.locator('.bui-composer .bui-choice-button').first().click();
			await page.keyboard.press('Escape');
			expect((await moving(page)).length === 0 && (await page.locator('.bui-leaving').count()) === 0, 'no menu picture');
			await page.locator('.bui-activity-head').first().click();
			expect((await moving(page)).length === 0, 'the row at once');
		}
	}
];
