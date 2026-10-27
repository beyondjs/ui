import { expect } from '../support/browser.mjs';
import { Insets } from '../support/insets.mjs';

/**
 * The inset measurer itself (0.41.0), in a real engine, on the measure page at 1440 and 390 px: it reads a
 * definition list whose groups are drawn as their children alone (`display: contents`) as it reads the same list
 * without them, never as an empty box; it says a box scrolls by what an inset trim hides under `overflow: hidden`
 * or `overflow: clip`, as it does for a scroller; and it says nothing scrolls in a box whose content fits, or whose
 * only overflow is hidden on purpose: a caption a clip hides, a text a line clamp ends. A background that draws
 * only a divider (a table's row lines) is no fill, and one that fills its row is. Products copy `support/insets.mjs`; this check holds it.
 */
const widths = [1440, 390];

async function open(browser, consumer, width) {
	const opened = await browser.open(consumer, { file: 'measure.html', viewport: { width, height: 900 }, prepare: context => Insets.install(context) });
	await opened.page.evaluate(() => document.fonts.ready);
	return opened;
}

export const checks = [
	{
		name: 'measure: a background that draws only a divider is no fill; one that fills the row is',
		consumers: ['dom'],
		run: async (browser, consumer) => {
			for (const width of widths) {
				const { page } = await open(browser, consumer, width);
				const lined = await Insets.measure(page, { box: '#lined' });
				const filled = await Insets.measure(page, { box: '#filled' });
				const said = `${browser.engine} ${width}px: ${JSON.stringify({ lined, filled })}`;
				expect(/Prepare storefront/.test(lined.by.left) && Math.abs(lined.left - 24) <= 0.5, `${said}: the divided row is measured by its words, one padding in`);
				expect(/measure-filled/.test(filled.by.left) && Math.abs(filled.left - 16) <= 0.5, `${said}: the filled row is measured by its fill`);
			}
		}
	},
	{
		name: 'measure: the inset measurer walks into a group drawn as its children alone (display: contents)',
		consumers: ['dom'],
		run: async (browser, consumer) => {
			for (const width of widths) {
				const { page } = await open(browser, consumer, width);
				const grouped = await Insets.measure(page, { box: '#grouped' });
				const flat = await Insets.measure(page, { box: '#flat' });
				const said = `${browser.engine} ${width}px: ${JSON.stringify({ grouped, flat })}`;
				expect(!grouped.empty && !grouped.missing, `${said}: the grouped list is measured by its words`);
				for (const side of ['top', 'bottom', 'left', 'right']) expect(Math.abs(grouped[side] - flat[side]) <= 0.5, `${said}: its ${side} is the flat list's`);
				expect(grouped.free === flat.free, `${said}: a group's empty box never says its line stops short`);
				expect(/Region/.test(grouped.by.left) && /Region/.test(grouped.by.top) && /Disk|GB left/.test(grouped.by.bottom), `${said}: its first term starts it and its last row ends it`);
			}
		}
	},
	{
		name: 'measure: a trim hidden by overflow: hidden or clip scrolls; a box that fits, a clipped caption and a clamped text do not',
		consumers: ['dom'],
		run: async (browser, consumer) => {
			for (const width of widths) {
				const { page } = await open(browser, consumer, width);
				const found = {};
				for (const id of ['hidden', 'clip', 'fits', 'caption', 'clamped']) found[id] = (await Insets.measure(page, { box: `#${id}` })).scrolls;
				const said = `${browser.engine} ${width}px: ${JSON.stringify(found)}`;
				expect(found.hidden > 1, `${said}: overflow: hidden counts what it hides`);
				expect(found.clip > 1, `${said}: overflow: clip counts what it hides`);
				expect(found.fits <= 1, `${said}: a box whose content fits scrolls by nothing`);
				expect(found.caption <= 1, `${said}: a caption clipped on purpose is not overflow`);
				expect(found.clamped <= 1, `${said}: a text a line clamp ends on purpose is not overflow`);
			}
		}
	}
];
