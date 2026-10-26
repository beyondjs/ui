import { expect, overflow } from '../support/browser.mjs';

/**
 * A raised panel pinned beside the main column (0.38.0, D189) in a real engine, on the `layout.html` pages made
 * Start an application (`?long=1`: sixteen components in the main column and the page's action first in the
 * raised panel). From the width where it sits beside the main column (a 68rem region) a pinned raised panel
 * (`?raised=1&pinned=1`) stays in view while the page scrolls, at the page's sticky edge and below a compact
 * header's line (`&compact=1`), its whole box within the window with a scroll of its own; it starts to stay where
 * it is, with nothing moving, the page still scrolls under the pointer over it and no focus ring in it is
 * clipped. Below that width (a region just under 68rem, and 390 px) it flows below the main column; a raised
 * panel without `pinned`, and a flat one with it, flow at 1440 px; and pinning draws nothing else differently.
 */
const cut = 68 * 16;
const pinned = '?raised=1&pinned=1&long=1';

async function open(browser, consumer, { width = 1440, height = 900, query = pinned, scheme = 'light', motion = 'no-preference' } = {}) {
	const view = await browser.open(consumer, { file: 'layout.html', query, viewport: { width, height }, colorScheme: scheme, reducedMotion: motion });
	await view.page.evaluate(() => document.fonts.ready);
	await view.page.waitForSelector('.bui-page-aside');
	await frames(view.page);
	return view;
}

const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/** Sizes the window so the page's region is `width` px wide beside its navigation; returns the region's width. */
async function region(page, width, height = 900) {
	for (let attempt = 0; attempt < 3; attempt++) {
		const { outer, inner } = await page.evaluate(() => ({ outer: innerWidth, inner: document.querySelector('.bui-page').getBoundingClientRect().width }));
		if (Math.abs(inner - width) <= 0.5) break;
		await page.setViewportSize({ width: Math.round(outer + width - inner), height });
		await frames(page);
	}
	return page.evaluate(() => document.querySelector('.bui-page').getBoundingClientRect().width);
}

/** The side panel, the page around it and the lengths its rule is made of, at the page's scroll now. */
const read = page =>
	page.evaluate(() => {
		const box = node => {
			const { top, bottom, left, right, width, height } = node.getBoundingClientRect();
			return { top, bottom, left, right, width, height };
		};
		// A length as the side panel's own rule resolves it, from a probe beside it
		const length = value => {
			const probe = document.querySelector('.bui-page-body').appendChild(Object.assign(document.createElement('div'), { style: `position: absolute; height: ${value}` }));
			const pixels = probe.getBoundingClientRect().height;
			probe.remove();
			return pixels;
		};
		const aside = document.querySelector('.bui-page-aside');
		const style = getComputedStyle(aside);
		const line = document.querySelector('.bui-page-compact[data-shown] .bui-page-compact-line');
		return {
			y: scrollY,
			end: document.documentElement.scrollHeight - innerHeight,
			document: document.documentElement.scrollHeight,
			window: innerHeight,
			aside: box(aside),
			pinned: aside.hasAttribute('data-pinned'),
			raised: aside.hasAttribute('data-raised'),
			position: style.position,
			top: parseFloat(style.top),
			cap: style.maxHeight,
			overflow: style.overflowY,
			room: aside.scrollHeight - aside.clientHeight,
			main: box(document.querySelector('.bui-page-main')),
			body: box(document.querySelector('.bui-page-body')),
			first: document.querySelector('.bui-page-main > .bui-section').getBoundingClientRect().top + scrollY,
			line: line ? box(line) : null,
			bar: document.querySelector('.bui-family').getBoundingClientRect().bottom,
			edge: length('var(--bui-page-sticky, calc(var(--layout-family) + var(--space-6)))'),
			compact: length('var(--bui-page-compact)'),
			gap: length('var(--space-6)')
		};
	});

async function at(page, y) {
	await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
	await frames(page);
	return read(page);
}

/** A pinned raised panel beside the main column stays at its edge from where it reaches it, with nothing moving. */
async function stays(page, said, edge) {
	const rest = await at(page, 0);
	expect(rest.pinned && rest.raised, `${said}: the raised panel is pinned`);
	expect(rest.aside.left >= rest.main.right - 1, `${said}: beside the main column: ${JSON.stringify(rest.aside)}`);
	expect(rest.position === 'sticky' && rest.overflow === 'auto' && rest.cap !== 'none', `${said}: it stays in view, with a scroll of its own: ${JSON.stringify(rest)}`);
	expect(Math.abs(rest.top - edge(rest)) <= 0.5, `${said}: at the page's sticky edge, ${rest.top} for ${edge(rest)}`);
	expect(rest.room <= 1, `${said}: shorter than the window, nothing in it scrolls (${rest.room} px)`);
	const natural = rest.aside.top + rest.y;
	const from = natural - rest.top;
	expect(from > 40 && rest.end >= from + 400, `${said}: it starts below its edge and the main column scrolls far past it: from ${from}, to ${rest.end}`);
	for (const y of [from - 40, from - 1, from + 1, from + 40, from + 400, rest.end]) {
		const found = await at(page, y);
		const expected = Math.min(Math.max(rest.top, natural - found.y), found.body.bottom - rest.aside.height);
		const where = `${said} at ${found.y}px`;
		expect(Math.abs(found.aside.top - expected) <= 1, `${where}: its top at ${found.aside.top}, ${expected} expected`);
		expect(found.aside.top >= found.bar - 0.5 && found.aside.top < found.window, `${where}: its top in view under the family bar: ${JSON.stringify(found.aside)}`);
		if (found.y >= from) expect(found.aside.bottom <= found.window - found.gap + 1, `${where}: at its edge, its whole box in the window: ${JSON.stringify(found.aside)}`);
		expect(['left', 'width', 'height'].every(side => Math.abs(found.aside[side] - rest.aside[side]) <= 0.5), `${where}: its box unchanged: ${JSON.stringify([found.aside, rest.aside])}`);
		expect(Math.abs(found.first - rest.first) <= 0.5 && Math.abs(found.document - rest.document) <= 0.5 && Math.abs(found.main.left - rest.main.left) <= 0.5, `${where}: nothing in the page moved`);
		expect(found.aside.bottom <= found.body.bottom + 1, `${where}: never past the main column's end`);
	}
	return { rest, from };
}

/** A side panel that keeps its place in the flow and scrolls away with the page. */
async function flows(page, said, beside) {
	const rest = await at(page, 0);
	expect(rest.position === 'static' && rest.cap === 'none' && rest.overflow === 'visible', `${said}: it keeps its place in the flow: ${JSON.stringify(rest)}`);
	if (beside) expect(rest.aside.left >= rest.main.right - 1, `${said}: beside the main column`);
	else expect(rest.aside.top >= rest.main.bottom - 1, `${said}: below the main column: ${JSON.stringify([rest.aside, rest.main])}`);
	const found = await at(page, Math.min(rest.end, 600));
	expect(found.y > 0 && Math.abs(found.aside.top - (rest.aside.top - found.y)) <= 1, `${said}: it scrolls with the page: ${found.aside.top} after ${found.y}px from ${rest.aside.top}`);
	expect(!(await overflow(page)), `${said}: no sideways scroll`);
	return rest;
}

/**
 * Every focus ring the keyboard draws in the side panel, measured against the panel's scroll: never clipped. `key`
 * moves through every control: WebKit's Tab skips buttons, as Safari's does, so Option+Tab there.
 */
async function rings(page, said, key) {
	await page.evaluate(() => [...document.querySelectorAll('.bui-page-main a[href], .bui-page-main button')].at(-1).focus());
	const seen = [];
	for (let press = 0; press < 12; press++) {
		await page.keyboard.press(key);
		// Past the page's last control the focus leaves the document, and Firefox keeps that control as the active element
		const ring = await page.evaluate(() => {
			const node = document.activeElement;
			const aside = document.querySelector('.bui-page-aside');
			const moved = node !== window.ringed;
			window.ringed = node;
			if (!moved || !aside.contains(node)) return { inside: false };
			const style = getComputedStyle(node);
			const out = style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
			const box = node.getBoundingClientRect();
			const frame = aside.getBoundingClientRect();
			const edge = getComputedStyle(aside);
			return {
				inside: true,
				name: node.textContent.trim(),
				drawn: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
				top: box.top - out - (frame.top + parseFloat(edge.borderTopWidth)),
				left: box.left - out - (frame.left + parseFloat(edge.borderLeftWidth)),
				right: frame.right - parseFloat(edge.borderRightWidth) - (box.right + out),
				bottom: frame.bottom - parseFloat(edge.borderBottomWidth) - (box.bottom + out)
			};
		});
		if (!ring.inside) {
			if (seen.length) break;
			continue;
		}
		seen.push(ring);
		expect(ring.drawn, `${said}: ${ring.name} is ringed`);
		expect(['top', 'left', 'right', 'bottom'].every(side => ring[side] >= -0.5), `${said}: the ring of ${ring.name} inside the panel's scroll: ${JSON.stringify(ring)}`);
	}
	expect(seen.length === 3, `${said}: Tab rings the panel's three actions: ${seen.map(ring => ring.name)}`);
}

/** What the side panel draws at the top of the page: its own style, its box and every part's place inside it. */
const drawing = page =>
	page.evaluate(() => {
		const aside = document.querySelector('.bui-page-aside');
		const frame = aside.getBoundingClientRect();
		const style = getComputedStyle(aside);
		const kept = ['display', 'rowGap', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderLeftWidth', 'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'boxShadow', 'width'];
		return {
			style: Object.fromEntries(kept.map(name => [name, style[name]])),
			box: [frame.top, frame.left, frame.width, frame.height],
			parts: [...aside.querySelectorAll('*')].map(node => {
				const part = node.getBoundingClientRect();
				return { name: `${node.tagName.toLowerCase()} ${node.textContent.trim().slice(0, 24)}`, place: [part.top - frame.top, part.left - frame.left, part.width, part.height] };
			}),
			main: [...document.querySelectorAll('.bui-page-main > *')].flatMap(node => [node.getBoundingClientRect().top, node.getBoundingClientRect().height]),
			room: aside.scrollHeight - aside.clientHeight
		};
	});

export const checks = [
	{
		name: "pinned panel (0.38.0, D189): a raised panel that holds the page's action stays in view beside a long main column at 1440 px in both themes and in a region just above 68rem, from where it reaches its edge, nothing moving",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const [width, scheme] of [[1440, 'light'], [1440, 'dark'], [null, 'light']]) {
				const { page, context } = await open(browser, consumer, { scheme });
				const wide = width ? null : await region(page, cut + 12);
				const said = `${width ? `${width}px` : `a ${wide}px region`} ${scheme}`;
				if (wide !== null) expect(wide > cut && wide <= cut + 16, `${said}: the region is just above 68rem`);
				await stays(page, said, found => found.edge);
				expect(!(await overflow(page)), `${said}: no sideways scroll`);
				await context.close();
			}
		}
	},
	{
		name: "pinned panel (0.38.0, D189): below a compact header's line; taller than the window, its whole box in it and its own scroll reaching its end; the page scrolls under the pointer over it; no focus ring in it clipped (1440 px)",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			// Under reduced motion the compact line shows at once, so it is measured where it rests
			const compact = await open(browser, consumer, { query: `${pinned}&compact=1`, motion: 'reduce' });
			const { from } = await stays(compact.page, 'with a compact line', found => found.edge + found.compact);
			const under = await at(compact.page, from + 200);
			await compact.page.waitForSelector('.bui-page-compact[data-shown]', { state: 'attached' });
			const shown = await read(compact.page);
			expect(shown.line && Math.abs(shown.aside.top - under.top) <= 1, `with a compact line: at its edge once the line shows: ${JSON.stringify(shown.aside)}`);
			expect(Math.abs(shown.aside.top - shown.line.bottom - shown.gap) <= 1, `with a compact line: one gap under the line, ${shown.aside.top} under ${shown.line.bottom}`);
			await compact.context.close();

			const short = await open(browser, consumer, { height: 420 });
			const rest = await read(short.page);
			expect(rest.room > 1, `a 420px window: taller than its room, it scrolls on its own (${rest.room} px)`);
			const stuck = await at(short.page, rest.aside.top + rest.y - rest.top + 100);
			expect(Math.abs(stuck.aside.top - stuck.top) <= 1 && Math.abs(stuck.aside.bottom - (stuck.window - stuck.gap)) <= 1, `a 420px window: from its edge to one gap above the window's end: ${JSON.stringify(stuck.aside)}`);
			await short.page.mouse.move(stuck.aside.left + stuck.aside.width / 2, stuck.aside.top + stuck.aside.height / 2);
			await short.page.mouse.wheel(0, 60);
			const moved = await short.page.waitForFunction(() => document.querySelector('.bui-page-aside').scrollTop > 0, null, { timeout: 3000 }).then(() => true, () => false);
			expect(moved, 'a 420px window: the wheel over it scrolls it');
			const end = await short.page.evaluate(() => {
				const aside = document.querySelector('.bui-page-aside');
				aside.scrollTop = aside.scrollHeight;
				const last = [...aside.querySelectorAll('button')].at(-1).getBoundingClientRect();
				const frame = aside.getBoundingClientRect();
				return { scrolled: aside.scrollTop, room: aside.scrollHeight - aside.clientHeight, last: last.bottom, inner: frame.bottom - parseFloat(getComputedStyle(aside).borderBottomWidth) };
			});
			expect(end.scrolled >= end.room - 1 && end.last <= end.inner + 0.5, `a 420px window: its own scroll reaches its last action: ${JSON.stringify(end)}`);
			await short.context.close();

			// Under reduced motion a ring is drawn at once where it rests, 2 px out
			const { page, context } = await open(browser, consumer, { motion: 'reduce' });
			const start = await read(page);
			const before = await at(page, start.aside.top + start.y - start.top + 40);
			await page.mouse.move(before.aside.left + before.aside.width / 2, before.aside.top + before.aside.height / 2);
			await page.mouse.wheel(0, 300);
			const scrolled = await page.waitForFunction(y => scrollY > y + 50, before.y, { timeout: 3000 }).then(() => true, () => false);
			expect(scrolled, `a panel that fits: the wheel over it scrolls the page from ${before.y}px`);
			await rings(page, '1440px', browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab');
			await context.close();
		}
	},
	{
		name: 'pinned panel (0.38.0, D189): below 68rem (a region just under it, and 390 px) a pinned raised panel flows below the main column; at 1440 px a raised panel without pinned, and a flat one with it, flow beside it',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const narrow = await open(browser, consumer);
			const width = await region(narrow.page, cut - 12);
			expect(width < cut && width >= cut - 16, `a ${width}px region: just under 68rem`);
			expect((await flows(narrow.page, `a ${width}px region`, false)).pinned, `a ${width}px region: the page's choice is kept for when it is wide`);
			await narrow.context.close();
			const phone = await open(browser, consumer, { width: 390 });
			await flows(phone.page, '390px', false);
			await phone.context.close();
			const unpinned = await open(browser, consumer, { query: '?raised=1&long=1' });
			expect(!(await flows(unpinned.page, '1440px raised without pinned', true)).pinned, '1440px raised without pinned: not pinned');
			await unpinned.context.close();
			const flat = await open(browser, consumer, { query: '?aside=1&pinned=1&long=1' });
			const found = await flows(flat.page, '1440px flat with pinned', true);
			expect(!found.pinned && !found.raised, '1440px flat with pinned: a flat panel is never pinned');
			await flat.context.close();
		}
	},
	{
		name: 'pinned panel (0.38.0, D189): pinning draws nothing else differently: the surface, line, inset, regions and rows where an unpinned raised panel draws them, beside at 1440 px and below at 390 px, in both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 390]) {
					const said = `${width}px ${scheme}`;
					const drawn = [];
					for (const query of ['?raised=1&long=1', pinned]) {
						const { page, context } = await open(browser, consumer, { width, scheme, query });
						drawn.push(await drawing(page));
						await context.close();
					}
					const [flowing, staying] = drawn;
					const same = (one, two) => one.length === two.length && one.every((value, index) => Math.abs(value - two[index]) <= 0.5);
					expect(JSON.stringify(staying.style) === JSON.stringify(flowing.style), `${said}: its own style: ${JSON.stringify([flowing.style, staying.style])}`);
					expect(same(staying.box, flowing.box), `${said}: its box: ${staying.box} / ${flowing.box}`);
					const moved = staying.parts.filter((part, index) => part.name !== flowing.parts[index]?.name || !same(part.place, flowing.parts[index].place));
					expect(staying.parts.length === flowing.parts.length && !moved.length, `${said}: every part in its place: ${JSON.stringify(moved.slice(0, 3))}`);
					expect(same(staying.main, flowing.main), `${said}: the main column in its place`);
					expect(staying.room <= 1, `${said}: nothing in it scrolls by what an inset trimmed (${staying.room} px)`);
				}
			}
		}
	}
];
