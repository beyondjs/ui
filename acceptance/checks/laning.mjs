import { join } from 'node:path';
import { expect, overflow } from '../support/browser.mjs';

/**
 * `Lanes` (0.27.0) in a real engine, on the `lanes.html` pages (the DOM page in English, the React pages
 * in Spanish): the columns align across lanes in both themes, one line a lane from 40rem of the block and
 * two below it (kind and trace gone), marks told apart by shape and never moving, a tick that moves only
 * the live bars' ends, a live line or a new lane that moves no other lane, no sideways scroll at 320 px,
 * and the keyboard (Tab to one lane, real arrows, Home, End, Enter and Space). Since 0.41.0 a title gets its
 * room first: at 1280 and 1440 px a block of six long titles as wide as a thread's turn folds its trace,
 * then its kind, only as far as its titles need, and a title no fold frees is shown whole on hover and focus
 * (D44). With `BEYOND_UI_SHOTS`
 * naming a directory outside the repository, each geometry check saves its screenshots there.
 */
const words = {
	en: { started: /^Started 10:42:05 · 1 min 4\d s so far$/ },
	es: { started: /^Empezó a las 10:42:05 · 1 min 4\d s hasta ahora$/ }
};

async function open(browser, consumer, options = {}) {
	const view = await browser.open(consumer, { file: 'lanes.html', viewport: { width: 1440, height: 900 }, ...options });
	await view.page.waitForSelector('.fixture-marks .bui-lanes-lane');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** Every lane of a block with its cells' boxes; a cell that is not drawn is null. */
const lanes = (page, block) =>
	page.evaluate(selector => {
		const box = node => {
			if (!node || getComputedStyle(node).display === 'none') return null;
			const { left, right, top, bottom, width, height } = node.getBoundingClientRect();
			// Where its words start: past its padding (a narrow lane's live line is indented to the title's words)
			return { left, right, top, bottom, width, height, words: left + Number.parseFloat(getComputedStyle(node).paddingLeft) };
		};
		return [...document.querySelectorAll(`${selector} .bui-lanes-lane`)].map(lane => ({
			key: lane.dataset.key,
			depth: Number(lane.dataset.depth),
			line: Number.parseFloat(getComputedStyle(lane).lineHeight),
			...Object.fromEntries(['lane', 'head', 'mark', 'title', 'kind', 'now', 'time', 'facts', 'trace', 'bar'].map(part => [part, box(part === 'lane' ? lane : lane.querySelector(`.bui-lanes-${part}`))]))
		}));
	}, block);

const same = (values, tolerance = 0.75) => values.every(value => Math.abs(value - values[0]) <= tolerance);
const shoot = async (page, browser, consumer, name) => {
	if (process.env.BEYOND_UI_SHOTS) await page.screenshot({ path: join(process.env.BEYOND_UI_SHOTS, `lanes-${browser.engine}-${consumer.name}-${name}.png`), fullPage: true });
};

/** One line a lane, its columns aligned across the block; a folded column (0.41.0) is not measured. */
function wide(found, at, folded = []) {
	expect(found.length >= 6, `${at}: the crew's lanes are drawn: ${found.length}`);
	for (const part of ['head']) expect(same(found.map(lane => lane[part].left)), `${at}: every head starts on one edge`);
	for (const part of ['kind', 'now', 'trace'].filter(part => !folded.includes(part))) {
		const drawn = found.filter(lane => lane[part]);
		expect(drawn.length && same(drawn.map(lane => lane[part].left)), `${at}: the ${part} column starts on one edge: ${JSON.stringify(drawn.map(lane => lane[part].left))}`);
	}
	for (const part of ['time', 'facts', 'trace'].filter(part => !folded.includes(part))) expect(same(found.filter(lane => lane[part]).map(lane => lane[part].right)), `${at}: the ${part} column ends on one edge`);
	expect(same(found.map(lane => lane.lane.height)), `${at}: every lane is as tall as the others: ${found.map(lane => lane.lane.height)}`);
	for (const lane of found) {
		const tops = ['title', 'now', 'time', 'facts'].filter(part => lane[part]).map(part => lane[part].top);
		expect(same(tops, 1.5), `${at}: ${lane.key} is one line: ${tops}`);
		expect(lane.lane.height < 2 * lane.line, `${at}: ${lane.key} is one line high`);
	}
	const nested = found.find(lane => lane.depth === 1);
	const parent = found.find(lane => lane.depth === 0);
	expect(nested.mark.left - parent.mark.left >= 18, `${at}: a nested lane's mark is indented: ${nested.mark.left - parent.mark.left}`);
}

/** Two lines a lane: the title and the time, then the live line under the title and the facts; no kind, no trace. */
function narrow(found, at) {
	for (const lane of found) {
		expect(!lane.kind && !lane.trace, `${at}: ${lane.key} draws no kind and no trace`);
		expect(Math.abs(lane.time.top - lane.title.top) <= 1.5, `${at}: ${lane.key}'s time on the title's line`);
		expect(lane.now.top >= lane.title.top + lane.line * 0.75, `${at}: ${lane.key}'s live line under its title`);
		expect(Math.abs(lane.now.words - lane.title.words) <= 1, `${at}: ${lane.key}'s live line starts under the title's words: ${lane.now.words} ${lane.title.words}`);
		if (lane.facts) expect(Math.abs(lane.facts.top - lane.now.top) <= 1.5 && Math.abs(lane.facts.right - lane.time.right) <= 0.75, `${at}: ${lane.key}'s facts under its time`);
	}
	expect(same(found.map(lane => lane.lane.height)), `${at}: every lane is two lines, the same height`);
	expect(found.every(lane => lane.lane.height >= 2 * lane.line), `${at}: two lines high`);
}

/** A block's fold, its titles' room, which titles are cut, and which would be with one fold fewer. */
const room = (page, selector) =>
	page.evaluate(selector => {
		const block = document.querySelector(`${selector} .bui-lanes`);
		const titles = [...block.querySelectorAll('.bui-lanes-title')];
		const cut = () => titles.filter(title => title.scrollWidth > title.clientWidth + 0.5).map(title => title.textContent.replace(/^, /, ''));
		const fold = block.dataset.fold ?? '';
		const now = cut();
		const room = Math.round(Math.min(...titles.map(title => title.clientWidth)));
		const steps = fold.split(' ').filter(Boolean);
		if (steps.length) block.dataset.fold = steps.slice(0, -1).join(' ');
		const fewer = steps.length ? cut() : [];
		const before = Math.round(Math.min(...titles.map(title => title.clientWidth)));
		if (steps.length) block.dataset.fold = fold;
		const kinds = [...block.querySelectorAll('.bui-lanes-kind:not([hidden])')].map(kind => ({ drawn: kind.getBoundingClientRect().width > 1, said: kind.closest('.bui-lanes-lane').textContent.includes(kind.textContent) }));
		const traces = [...block.querySelectorAll('.bui-lanes-trace')].filter(trace => getComputedStyle(trace).display !== 'none').length;
		return { fold, cut: now, room, before, fewer, kinds, traces };
	}, selector);

export const checks = [
	{
		name: 'lanes: a title\'s room first, six long titles at 1280 and 1440 px: the trace folds, then the kind, only as far as the titles need (0.41.0)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1280, 1440]) {
					const { page } = await open(browser, consumer, { colorScheme: scheme, viewport: { width, height: 900 } });
					const at = `${scheme} ${width} px`;
					const found = await room(page, '.fixture-room');
					const said = `${at}: ${JSON.stringify(found)}`;
					expect(found.cut.length === 0, `${said}: every title shows whole`);
					if (found.fold) expect(found.fewer.length > 0, `${said}: one fold fewer would cut a title, so nothing folds that need not`);
					expect(['', 'trace', 'trace kind', 'trace kind now'].includes(found.fold), `${said}: the trace folds before the kind, and the live line's room last`);
					expect(found.traces === (found.fold.includes('trace') ? 0 : 6), `${said}: a folded trace takes no cell`);
					expect(found.kinds.every(kind => kind.drawn === !found.fold.includes('kind') && kind.said), `${said}: a folded kind is not drawn and stays in the lane's name`);
					wide(await lanes(page, '.fixture-room'), `${at}, long titles`, found.fold.split(' '));
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await shoot(page, browser, consumer, `room-${scheme}-${width}`);
					await page.close();
				}
			}
		}
	},
	{
		name: 'lanes: a title no fold frees is cut last and shown whole, with its folded kind, on hover and on focus (0.41.0, D44)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { viewport: { width: 1440, height: 900 } });
			const found = await room(page, '.fixture-cramped');
			// Since 0.44.0 a third fold gives the title three quarters of the room it shares with the live line
			expect(found.fold === 'trace kind now' && found.cut.length >= 1, `the cramped block folds the trace, the kind and the live line's room before it cuts a title: ${JSON.stringify(found)}`);
			expect(found.room > found.before, `the last fold gives the titles more room: ${found.before} → ${found.room} px`);
			const lane = page.locator('.fixture-cramped .bui-lanes-lane').first();
			const whole = await lane.evaluate(node => [node.querySelector('.bui-lanes-title').textContent.replace(/^, /, ''), node.querySelector('.bui-lanes-kind').textContent.replace(/^, /, '')].join(' · '));
			const tip = page.locator('.bui-tooltip:not([hidden])');
			await lane.locator('.bui-lanes-title').hover();
			await tip.waitFor();
			expect((await tip.textContent()) === whole, `on hover: ${await tip.textContent()} / ${whole}`);
			await page.mouse.move(0, 0);
			await tip.waitFor({ state: 'hidden' });
			await lane.focus();
			await tip.waitFor();
			expect((await tip.textContent()) === whole, `on focus: ${await tip.textContent()}`);
			const box = await tip.evaluate(node => node.getBoundingClientRect().toJSON());
			expect(box.left >= 0 && box.right <= 1440, 'inside the viewport');
			await page.close();
		}
	},
	{
		name: 'lanes: columns aligned across lanes at 1440 and 1024 px in both themes, one line each, the box under 40rem two lines, marks by shape and still',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 1024]) {
					const { page } = await open(browser, consumer, { colorScheme: scheme, viewport: { width, height: 900 } });
					const at = `${scheme} ${width} px`;
					wide(await lanes(page, '.fixture-wide'), at);
					narrow(await lanes(page, '.fixture-narrow'), `${at}, a box under 40rem`);
					const plain = await lanes(page, '.fixture-marks');
					expect(plain.every(lane => !lane.trace && (!lane.time || lane.time.right <= lane.lane.right)), `${at}: without a trace no trace cell is drawn and the time keeps its column`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					const marks = await page.evaluate(() =>
						[...document.querySelectorAll('.fixture-marks .bui-status-dot')].map(dot => {
							const style = getComputedStyle(dot);
							return { shape: [style.borderStyle, style.borderRadius, style.transform, style.backgroundImage, style.backgroundColor].join('|'), moving: dot.getAnimations().filter(animation => animation.playState === 'running').length };
						})
					);
					expect(new Set(marks.map(mark => mark.shape)).size === 6, `${at}: six states, six marks: ${JSON.stringify(marks)}`);
					expect(marks.every(mark => mark.moving === 0), `${at}: no mark moves (LOAD-01)`);
					const bars = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.fixture-wide .bui-lanes-lane')].map(lane => [lane.dataset.state, getComputedStyle(lane.querySelector('.bui-lanes-bar')).backgroundColor])));
					expect(new Set(Object.values(bars)).size === 4, `${at}: running, done, waiting and failed bars in their own hues: ${JSON.stringify(bars)}`);
					await shoot(page, browser, consumer, `${scheme}-${width}`);
					await page.close();
				}
			}
		}
	},
	{
		name: 'lanes: two lines a lane at 390 and 320 px in both themes, no kind and no trace, nothing scrolls sideways',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [390, 320]) {
					const { page } = await open(browser, consumer, { colorScheme: scheme, viewport: { width, height: 844 } });
					narrow(await lanes(page, '.fixture-wide'), `${scheme} ${width} px`);
					expect(!(await overflow(page)), `${scheme} ${width} px: no sideways scroll`);
					await shoot(page, browser, consumer, `${scheme}-${width}`);
					await page.close();
				}
			}
		}
	},
	{
		name: 'lanes: a tick moves only the live bars\' ends; a longer live line, the axis\' next step and a new lane move no other lane',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer, { reducedMotion: 'reduce' });
			const boxes = async () => (await lanes(page, '.fixture-wide')).map(lane => ({ key: lane.key, lane: lane.lane, bar: lane.bar }));
			const before = await boxes();
			await page.evaluate(() => window.fixture.at(112_000));
			await page.waitForFunction(() => document.querySelector('.fixture-wide .bui-lanes-lane[data-key="explore"] .bui-lanes-time').textContent.includes('52'));
			const after = await boxes();
			const live = ['explore', 'plan', 'index', 'fix'];
			for (const [index, lane] of after.entries()) {
				expect(JSON.stringify(lane.lane) === JSON.stringify(before[index].lane), `${lane.key} did not move or resize on a tick`);
				expect(lane.bar.left === before[index].bar.left, `${lane.key}'s bar keeps its start`);
				if (live.includes(lane.key)) expect(lane.bar.width > before[index].bar.width, `${lane.key}'s bar grew at its end`);
				else expect(lane.bar.width === before[index].bar.width, `${lane.key}'s bar is still`);
			}
			const span = () => page.evaluate(() => getComputedStyle(document.querySelector('.fixture-wide .bui-lanes')).getPropertyValue('--bui-lanes-span').trim());
			expect((await span()) === '120000', `a 2 min axis after 112 s: ${await span()}`);
			await page.evaluate(() => window.fixture.at(130_000));
			await page.waitForFunction(() => getComputedStyle(document.querySelector('.fixture-wide .bui-lanes')).getPropertyValue('--bui-lanes-span').trim() === '300000');
			await page.evaluate(() => window.fixture.say('Reading a very long path that a narrow column cuts: src/payments/providers/stripe/webhooks/handlers/refunds.ts'));
			await page.waitForFunction(() => document.querySelector('.fixture-wide .bui-lanes-lane[data-key="plan"] .bui-lanes-now').textContent.includes('refunds'));
			const said = await boxes();
			for (const [index, lane] of said.entries()) expect(JSON.stringify(lane.lane) === JSON.stringify(before[index].lane), `${lane.key} kept its box when a live line grew`);
			await page.evaluate(() => window.fixture.add());
			await page.waitForFunction(() => document.querySelectorAll('.fixture-wide .bui-lanes-lane').length === 7);
			const added = await boxes();
			for (const [index, lane] of before.entries()) expect(JSON.stringify(added[index].lane) === JSON.stringify(lane.lane), `${lane.key} stayed in place when a lane was appended`);
			expect(added[6].key === 'summary' && added[6].lane.top >= before[5].lane.bottom - 0.5, 'the new lane is appended at the end');
			expect((await page.evaluate(() => document.getAnimations().length)) === 0, 'nothing animates under reduced motion');
			await page.close();
		}
	},
	{
		name: 'lanes: Tab reaches one lane, real arrows, Home and End move, Enter and Space choose, focus survives updates; the trace tooltip says the start',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const { page } = await open(browser, consumer);
			const focused = () => page.evaluate(() => (document.activeElement?.closest('.bui-lanes') ? `${document.activeElement.closest('section').className}:${document.activeElement.dataset.key}` : document.activeElement?.tagName));
			await page.locator('main > .bui-button, main > button').first().focus();
			await page.keyboard.press('Tab');
			expect((await focused()) === 'fixture-wide:explore', `Tab lands on the first lane: ${await focused()}`);
			for (const [key, expected] of [['ArrowDown', 'map'], ['ArrowDown', 'plan'], ['End', 'bench'], ['ArrowDown', 'bench'], ['Home', 'explore'], ['ArrowUp', 'explore'], ['ArrowDown', 'map']]) {
				await page.keyboard.press(key);
				expect((await focused()) === `fixture-wide:${expected}`, `${key} moves to ${expected}: ${await focused()}`);
			}
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.chosen.includes('map'));
			await page.waitForSelector('.fixture-wide .bui-lanes-lane[data-key="map"][aria-current="true"]');
			expect((await focused()) === 'fixture-wide:map', 'focus stays on the chosen lane once it is current');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press(' ');
			await page.waitForFunction(() => window.fixture.chosen.includes('plan'));
			await page.evaluate(() => window.fixture.at(105_000));
			await page.evaluate(() => window.fixture.say('Writing the review'));
			await page.waitForFunction(() => document.querySelector('.fixture-wide .bui-lanes-lane[data-key="plan"] .bui-lanes-now').textContent.includes('review'));
			expect((await focused()) === 'fixture-wide:plan', `focus survives a tick and a patch: ${await focused()}`);
			await page.keyboard.press('Tab');
			expect((await focused()) === 'fixture-narrow:plan', `Tab moves to the next block's current lane: ${await focused()}`);
			const tabbable = await page.evaluate(() => document.querySelectorAll('.fixture-wide .bui-lanes-lane[tabindex="0"]').length);
			expect(tabbable === 1, `one lane of a block in the tab order: ${tabbable}`);
			await page.locator('.fixture-wide .bui-lanes-lane[data-key="explore"] .bui-lanes-trace').hover();
			const tip = page.locator('.bui-tooltip:not([hidden])');
			await tip.waitFor();
			const shown = await tip.evaluate(node => ({ text: node.textContent, top: node.matches(':popover-open'), box: node.getBoundingClientRect().toJSON() }));
			expect(words[consumer.language].started.test(shown.text), `the trace's tooltip: ${shown.text}`);
			expect(shown.top && shown.box.left >= 0 && shown.box.right <= 1440, 'in the top layer, inside the viewport');
			await page.close();
		}
	}
];
