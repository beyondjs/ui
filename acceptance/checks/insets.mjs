import { appendFileSync } from 'node:fs';
import { expect } from '../support/browser.mjs';
import { Insets } from '../support/insets.mjs';
import { pages } from './insets-boxes.mjs';

/**
 * One inset (D184) in a real engine: every box of the package that holds text or controls inside a border or a
 * fill keeps one inset on every side, measured optically from its inner border edges to its first line's
 * capitals, its last line's baseline or its controls' edges, and its content's start and end
 * (`support/insets.mjs`), at 1440 and 390 px in both themes. A side is held to the box's own inset within a
 * pixel; a free side (room a short line or a product's last row leaves) never comes closer than the inset.
 * Boxes that keep their unevenness until a design decision are measured for the record only. With
 * `BEYOND_UI_INSETS` naming a file outside the repository, every measurement is appended to it as a JSON line.
 */
const sides = ['top', 'bottom', 'left', 'right'];

async function view(browser, consumer, page, width, scheme) {
	const opened = await browser.open(consumer, { file: page.file ?? undefined, query: page.query ?? '', viewport: { width, height: 900 }, colorScheme: scheme, prepare: context => Insets.install(context) });
	await opened.page.evaluate(() => document.fonts.ready);
	return opened;
}

/**
 * Waits for what moves the box: its own entry, an opening around it (a dialog's, a row's body) and a transition
 * inside it, never a live mark's pulse or a spinner; then for the box to hold still for three frames, since an
 * engine does not report every transition (Chrome's `::details-content` easing its height).
 */
const still = (page, box) =>
	page.evaluate(async ({ selector, nth }) => {
		const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
		await frame();
		await frame();
		const node = document.querySelectorAll(selector)[nth];
		const moving = document.getAnimations().filter(animation => {
			const target = animation.effect?.target;
			const around = target?.contains?.(node) && animation.effect.getComputedTiming().endTime !== Infinity;
			return around || (animation instanceof CSSTransition && node.contains(target));
		});
		await Promise.all(moving.map(animation => animation.finished.catch(() => undefined)));
		const shape = () => JSON.stringify(node.getBoundingClientRect());
		for (let last = shape(), same = 0, frames = 0; same < 3 && frames < 90; frames += 1) {
			await frame();
			const now = shape();
			same = now === last ? same + 1 : 0;
			last = now;
		}
	}, { selector: box.box, nth: box.nth ?? 0 });

/** The box's inset in pixels: its custom property, read on the box, or the number its spec gives. */
const inset = (page, box) =>
	typeof box.inset === 'number'
		? box.inset
		: page.evaluate(({ selector, nth, name }) => parseFloat(getComputedStyle(document.querySelectorAll(selector)[nth]).getPropertyValue(name)), { selector: box.box, nth: box.nth ?? 0, name: box.inset });

function hold(found, box, value, at) {
	const said = `${at} ${box.name}: ${JSON.stringify({ ...found, inset: value })}`;
	expect(!found.missing && !found.empty, `${said}: the box is drawn with content`);
	for (const side of box.sides ?? sides) {
		const free = box.free?.includes(side) || (side === 'right' && found.free);
		if (free) expect(found[side] >= value - 1, `${said}: its ${side} never comes closer than its inset`);
		else expect(Math.abs(found[side] - value) <= 1, `${said}: its ${side} keeps its inset within a pixel`);
	}
}

async function measure(browser, consumer, list) {
	for (const page of list) {
		if (page.consumers && !page.consumers.includes(consumer.name)) continue;
		for (const scheme of ['light', 'dark']) {
			for (const width of page.widths ?? [1440, 390]) {
				const at = `${browser.engine} ${width}px ${scheme}`;
				const opened = await view(browser, consumer, page, width, scheme);
				for (const step of page.steps) {
					await step.open?.(opened.page, consumer);
					for (const box of step.boxes) {
						await opened.page.locator(box.box).nth(box.nth ?? 0).waitFor({ state: 'visible', timeout: 5000 });
						await still(opened.page, box);
						const found = await Insets.measure(opened.page, box);
						const value = await inset(opened.page, box);
						if (process.env.BEYOND_UI_INSETS) appendFileSync(process.env.BEYOND_UI_INSETS, `${JSON.stringify({ engine: browser.engine, consumer: consumer.name, width, scheme, box: box.name, inset: value, held: box.sides ?? sides, ...found })}\n`);
						hold(found, box, value, at);
					}
				}
				await opened.context.close();
			}
		}
	}
}

export const checks = [
	{
		name: 'insets (D184): callouts, Unavailable, Recovery, an empty state, a checklist, a raised section, a textarea and toasts keep one inset, at 1440 and 390 px in both themes',
		consumers: ['dom', 'react19'],
		run: (browser, consumer) => measure(browser, consumer, pages.notices)
	},
	{
		name: 'insets (D184): CommandCard and its code, choice cards and menus, the raised side panel, Select, the awaited card and technical details keep one inset, at 1440 and 390 px in both themes',
		consumers: ['dom', 'react19'],
		run: (browser, consumer) => measure(browser, consumer, pages.cards)
	},
	{
		name: 'insets (D184): a dialog and its field, a confirmation, a side sheet\'s head, menus, toasts, help, tooltips, notification rows, the command palette and a turn\'s preview keep one inset, at 1440 and 390 px in both themes',
		consumers: ['dom', 'react19'],
		run: (browser, consumer) => measure(browser, consumer, pages.overlays)
	}
];
