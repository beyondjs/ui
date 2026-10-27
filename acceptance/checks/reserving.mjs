import { expect, overflow } from '../support/browser.mjs';

/**
 * A page drawn before its object's reads answer holds every place (0.44.0, LOAD-01, D185), on the
 * `pending.html` pages: the arrival line unseen and inert until its way back is known; a pending title, one
 * placeholder line at the title's height named "Loading…", busy and out of focus, a router's focus landing
 * once the title does; Restore's place reserved, unseen and never offered; a facts line holding a
 * ChoiceMenu with no paragraph around it; a part of Devices waiting beside its action, History waiting whole,
 * and the sidebar's projects waiting, each a shared wait seen only past its grace. Once every read answers,
 * nothing above the waits moves: the arrival line, the H1's line and height, the facts, the tabs, Restore's
 * line and size and the first section's title keep their boxes within half a pixel, at 1440 px in both themes
 * and at 390 px. Two moves are the page's, not a held place's: a resource page (`detail`) draws its actions
 * right after the title, so they follow the title's width, which no placeholder knows; and what follows a
 * wait moves with the length of what it waited for, which LOAD-01 never invents. With `?refused=1` the
 * reserved action is withdrawn and was never offered.
 */
async function open(browser, consumer, { width = 1440, scheme = 'light', query = '' } = {}) {
	// React's nesting warnings are console errors, not page errors: kept from the first render
	const prepare = context =>
		context.addInitScript(() => {
			window.said = [];
			const error = console.error;
			console.error = (...args) => {
				window.said.push(args.map(String).join(' '));
				error.apply(console, args);
			};
		});
	const view = await browser.open(consumer, { file: 'pending.html', query, viewport: { width, height: 900 }, colorScheme: scheme, prepare });
	await view.page.waitForSelector('.bui-page-heading .bui-page-pending');
	await view.page.evaluate(() => document.fonts.ready);
	return view;
}

/** The boxes that must not move, and what each part says about itself */
const read = page =>
	page.evaluate(() => {
		const box = node => {
			if (!node || !node.getClientRects().length) return null;
			const rect = node.getBoundingClientRect();
			return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
		};
		const one = selector => document.querySelector(selector);
		const restore = [...document.querySelectorAll('.bui-page-actions button')].find(button => /Restore|Restaurar/.test(button.textContent)) ?? null;
		const heading = one('.bui-page-heading');
		return {
			// The title's width and an action's place after it follow the title's words (a resource page's actions)
			boxes: { arrival: box(one('.bui-arrival')), heading: { ...box(heading), x: 0, width: 0 }, line: box(one('.bui-page-title')), facts: box(one('.bui-page-facts')), tabs: box(one('.bui-page-tabs')), restore: restore && { ...box(restore), x: 0 }, section: box(one('.bui-section-title')) },
			heading: { text: heading.textContent.trim(), busy: heading.getAttribute('aria-busy'), tabindex: heading.getAttribute('tabindex') },
			restore: restore && { seen: getComputedStyle(restore).visibility, inert: restore.closest('[inert]') !== null, hidden: restore.closest('[aria-hidden="true"]') !== null },
			arrival: { seen: getComputedStyle(one('.bui-arrival')).visibility, inert: one('.bui-arrival').hasAttribute('inert'), href: one('.bui-arrival a').getAttribute('href') },
			busy: [...document.querySelectorAll('[aria-busy="true"]')].map(node => node.className.split(' ')[0]),
			waits: document.querySelectorAll('.bui-waiting, .bui-page-pending').length,
			facts: { tag: one('.bui-page-facts').tagName, choice: one('.bui-page-facts .bui-choice-button') !== null, paragraph: one('.bui-page-facts .bui-choice-button')?.closest('p') !== null },
			said: window.said.filter(text => /validateDOMNesting|cannot be a descendant|cannot contain a nested/.test(text))
		};
	});

/** Every graced wait: the opening sees it, and it is seen only past its 300 ms grace */
const graced = page =>
	page.evaluate(() =>
		[...document.querySelectorAll('.bui-waiting, .bui-page-pending')].filter(node => node.getClientRects().length).map(node => {
			const timing = node.getAnimations()[0]?.effect.getTiming();
			return { name: node.className.split(' ').at(-1), delay: timing?.delay ?? null };
		})
	);

/** The boxes that moved beyond half a pixel */
const moved = (before, after) =>
	Object.entries(before)
		.filter(([, box]) => box)
		.flatMap(([name, box]) => (!after[name] ? [`${name} gone`] : ['x', 'y', 'width', 'height'].filter(key => Math.abs(box[key] - after[name][key]) > 0.5).map(key => `${name} ${key} ${box[key].toFixed(1)} → ${after[name][key].toFixed(1)}`)));

export const checks = [
	{
		name: 'pending page (0.44.0, LOAD-01, D185): every place held while the reads run, then nothing moves once they answer, at 1440 px in both themes and at 390 px',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const loading = consumer.language === 'es' ? 'Cargando…' : 'Loading…';
			for (const { width, scheme } of [{ width: 1440, scheme: 'light' }, { width: 1440, scheme: 'dark' }, { width: 390, scheme: 'light' }]) {
				const at = `${width} px ${scheme}`;
				const { page, context, errors } = await open(browser, consumer, { width, scheme });
				const before = await read(page);
				expect(before.heading.text === loading && before.heading.busy === 'true' && before.heading.tabindex === null, `${at}: the title waits, named "${loading}", busy and out of focus: ${JSON.stringify(before.heading)}`);
				expect(before.boxes.heading.height > 20, `${at}: the pending title holds a line: ${JSON.stringify(before.boxes.heading)}`);
				expect(before.restore?.seen === 'hidden' && before.restore.inert && before.restore.hidden, `${at}: Restore's place is held, unseen, inert and hidden: ${JSON.stringify(before.restore)}`);
				expect(before.arrival.seen === 'hidden' && before.arrival.inert && before.arrival.href === null, `${at}: the arrival line holds its place unseen: ${JSON.stringify(before.arrival)}`);
				expect(['bui-page-heading', 'bui-section'].every(name => before.busy.includes(name)) && before.busy.filter(name => name === 'bui-section').length === 2, `${at}: the title, Devices (its part) and History are busy: ${before.busy.join(', ')}`);
				if (width >= 1024) expect(before.busy.includes('bui-sidebar-group'), `${at}: the sidebar's projects are busy: ${before.busy.join(', ')}`);
				expect(before.facts.tag === 'DIV' && before.facts.choice && !before.facts.paragraph && !before.said.length, `${at}: the facts line holds the ChoiceMenu with no paragraph around it: ${JSON.stringify(before.facts)} ${before.said.join(' | ')}`);
				const waits = await graced(page);
				// The title, Devices' part and History, and beside them from 1024 px the sidebar's projects (a drawer below)
				expect(waits.length >= (width >= 1024 ? 4 : 3) && waits.every(wait => wait.delay === 300), `${at}: every wait is graced: ${JSON.stringify(waits)}`);
				expect(!(await overflow(page)), `${at}: no sideways scroll while waiting`);

				// A router's focus on the title is kept until the title lands; a press where Restore will be does nothing
				await page.evaluate(() => window.fixture.focus());
				expect(await page.evaluate(() => !document.activeElement || document.activeElement === document.body), `${at}: nothing named "${loading}" takes the focus`);
				if (before.boxes.restore) await page.mouse.click(before.boxes.restore.x + before.boxes.restore.width / 2, before.boxes.restore.y + before.boxes.restore.height / 2);
				expect(await page.evaluate(() => !window.fixture.log.length), `${at}: a press where Restore will be runs nothing`);

				await page.evaluate(() => window.fixture.answer());
				await page.waitForFunction(() => !document.querySelector('.bui-waiting, .bui-page-pending, [aria-busy="true"]'), null, { timeout: 3000 });
				await page.waitForFunction(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))));
				const after = await read(page);
				const moves = moved(before.boxes, after.boxes);
				expect(!moves.length, `${at}: nothing moved once the reads answered: ${moves.join('; ')}`);
				expect(after.heading.busy === null && after.heading.tabindex === '-1' && after.heading.text !== loading, `${at}: the title is named: ${JSON.stringify(after.heading)}`);
				expect(await page.evaluate(() => document.activeElement === document.querySelector('.bui-page-heading')), `${at}: the kept focus landed on the title`);
				expect(after.restore?.seen === 'visible' && !after.restore.inert && !after.restore.hidden, `${at}: Restore is offered: ${JSON.stringify(after.restore)}`);
				expect(after.arrival.seen === 'visible' && !after.arrival.inert && after.arrival.href === '#/projects/p0', `${at}: the arrival line shows its way back: ${JSON.stringify(after.arrival)}`);
				await page.getByRole('button', { name: consumer.language === 'es' ? 'Restaurar' : 'Restore', exact: true }).click();
				expect(await page.evaluate(() => window.fixture.log.join()) === 'restore', `${at}: Restore runs once offered`);
				expect(!errors.length && !after.said.length, `${at}: no page error or nesting warning: ${[...errors, ...after.said].join(' | ')}`);
				await context.close();
			}
		}
	},
	{
		name: 'pending page (0.44.0): a refused action is withdrawn from its reserved place and was never offered',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await open(browser, consumer, { query: '?refused=1' });
			const before = await read(page);
			await page.evaluate(() => window.fixture.answer());
			await page.waitForFunction(() => !document.querySelector('.bui-waiting, .bui-page-pending'), null, { timeout: 3000 });
			const after = await read(page);
			expect(before.restore?.inert && after.restore === null, `refused: Restore held, then withdrawn: ${JSON.stringify({ before: before.restore, after: after.restore })}`);
			// The title's line keeps its own height once the action taller than it is withdrawn: what moves is that difference
			if (process.env.DEBUG) console.log(`     refused: the title ${before.boxes.heading.y.toFixed(1)} → ${after.boxes.heading.y.toFixed(1)}, its line ${before.boxes.line.height.toFixed(1)} → ${after.boxes.line.height.toFixed(1)}`);
			expect(await page.evaluate(() => !window.fixture.log.length), 'refused: nothing ran');
			await context.close();
		}
	}
];
