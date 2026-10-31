import { expect, overflow } from '../support/browser.mjs';
import { Frames, Settling } from '../support/frames.mjs';

/**
 * A composer drawn settled from the frame a narrowing lands (0.32.0), on the `settle.html` pages (the DOM page in
 * English, the React page in Spanish): a running Codex turn's composer, docked in the thread template or held in a
 * plain page's section, beside the Sidebar with a panel kept in view. The window narrows across the panel's cut, the
 * Sidebar's cut and the composer's 30rem (1440 → 390, 1440 → 1100, 1024 → 700 and 600 → 440 px), and every frame
 * it paints for 300 ms after is read: the box's place and size, where the text and the toolbar's first control
 * start and the toolbar's rows and level. Each frame, the landing one included, must be the settled one within
 * 1 px. Until 0.32.0 the frame the resize landed drew the toolbar at the level of the width before (four rows at
 * 390 px in Firefox and WebKit), or at a level measured while the page was still laid out for it (Chrome), and the
 * next frame corrected it.
 */
const narrowings = [
	[1440, 390],
	[1440, 1100],
	[1024, 700],
	[600, 440]
];
const pages = [
	{ query: '', name: 'a composer docked in a thread' },
	{ query: '?page=plain', name: "a composer in a plain page's section" }
];

async function open(browser, consumer, query, width) {
	const view = await browser.open(consumer, { file: 'settle.html', query, viewport: { width, height: 900 } });
	await view.page.waitForSelector('.bui-composer-field');
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50)))));
	return view;
}

/** Presses the page's Details in the task that marks the frames: the panel hides or shows beside, the window unchanged. */
const toggle = (page, label) =>
	page.evaluate(text => {
		window.__frames.marked = true;
		[...document.querySelectorAll('.bui-page-header button')].find(button => button.textContent.trim() === text).click();
	}, label);

const narrowing = pages.map(({ query, name }) => ({
	name: `settling: ${name} is drawn settled on every frame from the one a narrowing lands, across the panel's cut, the Sidebar's and the composer's 30rem`,
	consumers: ['dom', 'react19'],
	async run(browser, consumer) {
		const report = [];
		let changed = 0;
		for (const [from, to] of narrowings) {
			const at = `${from} → ${to} px`;
			const { page, context } = await open(browser, consumer, query, from);
			const frames = new Frames(page);
			await frames.start(['.bui-composer'], { width: to });
			// A few frames at the width before, then the window narrows while the recorder reads every frame
			await page.waitForTimeout(50);
			await page.setViewportSize({ width: to, height: 900 });
			const settling = new Settling(await frames.read(), to);
			const [settled] = settling.settled;
			expect(settling.frames.length >= 5 && settled, `${at}: the frames after the resize were read: ${settling.frames.length}`);
			const [before] = settling.before;
			if (before?.fit !== settled.fit) changed += 1;
			report.push(`${at}: ${before?.fit ?? 'none'} → ${settled.fit}`, ...settling.lines());
			const misplaced = settling.misplaced;
			expect(!misplaced.length, `${at}: ${misplaced.length} misplaced frames, the first ${JSON.stringify(misplaced[0])}; ${settling.lines().slice(0, 3).join(' / ')}`);
			expect(!(await overflow(page)), `${at}: no sideways scroll`);
			await context.close();
		}
		if (process.env.DEBUG) console.log(report.map(line => `     ${line}`).join('\n'));
		// The narrowings change the toolbar's level (every word, the chips' values, folded): the check reads its decision
		expect(changed >= 2, `the narrowings change the toolbar's level: ${report.filter(line => line.includes(' → ') && line.includes('px:')).join('; ')}`);
	}
}));

/**
 * A change of the columns without the window's (0.32.0): at 1440 px the panel beside the thread is hidden and
 * shown again with Details, which widens and narrows the composer (768 and 710 px) and changes its toolbar's
 * level. The page's panel says so (`Relayout`), so the composer decides in the frame the change lands, as it does
 * for the window's resize; until 0.32.0 its first frame drew the level of the width before.
 */
const panel = {
	name: 'settling: a composer docked in a thread is drawn settled on every frame from the one its panel is hidden or shown beside, with the window unchanged',
	consumers: ['dom', 'react19'],
	async run(browser, consumer) {
		// The page's Details, as `fixtures/data/settle.js` words it (that module reads the page's address)
		const label = consumer.name === 'dom' ? 'Details' : 'Detalles';
		const { page, context } = await open(browser, consumer, '', 1440);
		let changed = 0;
		for (const step of ['hidden', 'shown']) {
			const frames = new Frames(page);
			await frames.start(['.bui-composer']);
			await page.waitForTimeout(50);
			await toggle(page, label);
			const settling = new Settling(await frames.read(), null);
			const [settled] = settling.settled;
			const [before] = settling.before;
			expect(settling.frames.length >= 5 && settled && before, `${step}: the frames after the change were read: ${settling.frames.length}`);
			expect(Math.abs(settled.width - before.width) > 1, `${step}: the composer's width changed: ${before.width} → ${settled.width}`);
			if (before.fit !== settled.fit || before.rows !== settled.rows) changed += 1;
			// A panel leaving keeps its space through its exit (D95): a frame may still be at the width before,
			// but each frame draws the toolbar of its own width, never the other's
			const same = (a, b) => ['height', 'text', 'start'].every(name => Math.abs(a[name] - b[name]) <= 1) && a.rows === b.rows && a.fit === b.fit;
			const wrong = settling.frames
				.map((frame, index) => ({ index, composer: frame.composers[0] }))
				.filter(({ composer }) => !(Math.abs(composer.width - settled.width) <= 1 ? same(composer, settled) : Math.abs(composer.width - before.width) <= 1 && same(composer, before)));
			expect(!wrong.length, `${step}: ${wrong.length} frames draw another width's toolbar, the first ${JSON.stringify(wrong[0])}; ${settling.lines().slice(0, 4).join(' / ')}`);
			await page.waitForTimeout(400);
		}
		expect(changed === 2, `hiding and showing the panel change the toolbar's level both ways: ${changed}`);
		await context.close();
	}
};

/**
 * The recorder's own guard (0.47.0 candidate): a change made after a frame began and before that frame's read (a
 * task between them, as Playwright's evaluate can run) must not be read as that frame. Firefox once read the panel
 * already shown as the frame before the press (710 → 710 px, ui's pending `ui-firefox-panel-settling-check`). A
 * loop started before the recorder posts, from each frame, a task queued ahead of the recorder's; armed, that task
 * presses Details. The frame it lands between is read as not painted, and the frame before keeps the width before.
 */
const race = {
	name: "settling: a change made between a frame and its read is never read as that frame's",
	consumers: ['dom', 'react19'],
	async run(browser, consumer) {
		const label = consumer.name === 'dom' ? 'Details' : 'Detalles';
		const { page, context } = await open(browser, consumer, '', 1440);
		await page.evaluate(text => {
			const button = [...document.querySelectorAll('.bui-page-header button')].find(item => item.textContent.trim() === text);
			const channel = new MessageChannel();
			const race = { armed: false, pressed: false };
			window.__race = race;
			channel.port1.onmessage = () => {
				// Only between the recorder's frame and its read: a frame already read waits for the next
				const frames = window.__frames;
				if (!race.armed || race.pressed || frames.samples.at(-1)?.frame === frames.frame) return;
				race.pressed = true;
				window.__frames.marked = true;
				button.click();
			};
			const tick = () => {
				if (race.pressed) return;
				channel.port2.postMessage(null);
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, label);
		const frames = new Frames(page);
		await frames.start(['.bui-composer']);
		await page.waitForTimeout(50);
		await page.evaluate(() => (window.__race.armed = true));
		const samples = await frames.read();
		const settling = new Settling(samples, null);
		const [settled] = settling.settled;
		const [before] = settling.before;
		const stale = samples.filter(sample => !sample.painted && !sample.marked);
		expect(stale.length === 1, `the frame the press landed between is read as not painted: ${stale.length}`);
		expect(settled && before && Math.abs(settled.width - before.width) > 1, `the frame before keeps the width before: ${before?.width} → ${settled?.width}`);
		await context.close();
	}
};

export const checks = [...narrowing, panel, race];
