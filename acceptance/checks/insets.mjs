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
 * Since 0.35.0 every box is measured again at compact density (`data-density="compact"` on the root) and
 * with a coarse pointer (touch emulated), in the plain DOM consumer, whose markup the React one shares, a box's
 * `touch` giving what it keeps instead on a touch screen; an inset that is not a length fails.
 */
const sides = ['top', 'bottom', 'left', 'right'];

/** The ways a page is drawn: as it comes, at compact density, and with a coarse pointer (0.35.0). */
const modes = {
	comfortable: { options: {}, prepare: () => undefined },
	// Set as soon as the root element exists: an init script runs before the parser makes it
	compact: { options: {}, prepare: context => context.addInitScript(() => {
		const set = () => document.documentElement && (document.documentElement.dataset.density = 'compact');
		if (!set()) new MutationObserver((changes, observer) => set() && observer.disconnect()).observe(document, { childList: true });
	}) },
	coarse: { options: { hasTouch: true, isMobile: true }, prepare: () => undefined }
};

async function view(browser, consumer, page, width, scheme, mode) {
	const { options, prepare } = modes[mode];
	const opened = await browser.open(consumer, { file: page.file ?? undefined, query: page.query ?? '', viewport: { width, height: 900 }, colorScheme: scheme, ...options, prepare: async context => (await Insets.install(context), await prepare(context)) });
	await opened.page.evaluate(() => document.fonts.ready);
	const drawn = await opened.page.evaluate(() => ({ density: document.documentElement.dataset.density ?? null, coarse: matchMedia('(pointer: coarse)').matches }));
	expect(drawn.density === (mode === 'compact' ? 'compact' : null) && drawn.coarse === (mode === 'coarse'), `${mode}: the page is drawn so: ${JSON.stringify(drawn)}`);
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

/** What a box breaks: none when it is drawn with content and keeps its inset within a pixel. */
function hold(found, box, value, at) {
	const said = `${at} ${box.name}: ${JSON.stringify({ ...found, inset: value })}`;
	if (found.missing || found.empty) return [`${said}: the box is drawn with content`];
	const broken = [];
	if (!Number.isFinite(value)) return [`${said}: its inset is a length`];
	if (!box.scrolls && found.scrolls > 1) broken.push(`${said}: nothing in it scrolls by what an inset trimmed (${found.scrolls} px)`);
	for (const side of box.sides ?? sides) {
		const free = box.free?.includes(side) || (side === 'right' && found.free);
		if (free && found[side] < value - 1) broken.push(`${said}: its ${side} never comes closer than its inset`);
		else if (!free && Math.abs(found[side] - value) > 1) broken.push(`${said}: its ${side} keeps its inset within a pixel`);
	}
	return broken;
}

/** Measures every box of the pages in a mode, and fails once with every box that broke, so one run says them all. */
async function measure(browser, consumer, list, mode = 'comfortable') {
	const broken = [];
	for (const page of list) {
		if (page.consumers && !page.consumers.includes(consumer.name)) continue;
		for (const scheme of ['light', 'dark']) {
			for (const width of page.widths ?? [1440, 390]) {
				const at = `${browser.engine} ${width}px ${scheme}${mode === 'comfortable' ? '' : ` ${mode}`}`;
				const opened = await view(browser, consumer, page, width, scheme, mode);
				for (const step of page.steps) {
					await step.open?.(opened.page, consumer);
					for (const listed of step.boxes) {
						const box = mode === 'coarse' && listed.touch ? { ...listed, ...listed.touch } : listed;
						await opened.page.locator(box.box).nth(box.nth ?? 0).waitFor({ state: 'visible', timeout: 5000 });
						await still(opened.page, box);
						const found = await Insets.measure(opened.page, box);
						// A single-line control's height decides the room above its capitals: its sides keep that room (0.35.0)
						const value = box.inset === 'even' ? found.top : await inset(opened.page, box);
						const failed = hold(found, box, value, at);
						if (process.env.BEYOND_UI_INSETS) appendFileSync(process.env.BEYOND_UI_INSETS, `${JSON.stringify({ engine: browser.engine, consumer: consumer.name, mode, width, scheme, box: box.name, inset: value, held: box.sides ?? sides, failed: failed.length, ...found })}\n`);
						broken.push(...failed);
					}
				}
				await opened.context.close();
			}
		}
	}
	expect(!broken.length, `${broken.length} sides broke: ${broken.join(' | ')}`);
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
	},
	// Compact density and a coarse pointer change the controls' and targets' heights: every box again (0.35.0)
	...['compact', 'coarse'].flatMap(mode => ['notices', 'cards', 'overlays'].map(group => ({
		name: `insets (D184) ${mode === 'compact' ? 'at compact density' : 'with a coarse pointer'}: the ${group} keep one inset, at 1440 and 390 px in both themes (0.35.0)`,
		consumers: ['dom'],
		run: (browser, consumer) => measure(browser, consumer, pages[group], mode)
	})))
];
