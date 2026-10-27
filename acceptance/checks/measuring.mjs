import { expect } from '../support/browser.mjs';
import { Insets } from '../support/insets.mjs';

/**
 * The inset measurer itself (0.41.0), in a real engine, on the measure page at 1440 and 390 px: it reads a
 * definition list whose groups are drawn as their children alone (`display: contents`) as it reads the same list
 * without them, never as an empty box; it says a box scrolls by what an inset trim hides under `overflow: hidden`
 * or `overflow: clip`, as it does for a scroller; and it says nothing scrolls in a box whose content fits, or whose
 * only overflow is hidden on purpose: a caption a clip hides, a text a line clamp ends, whose hidden lines decide
 * no side. A background that draws only a divider (a table's row lines) is no fill; one that fills its row, or a
 * thin layer that repeats into a fill, is. Since 0.44.0 it reads words a stylesheet generates: a stacked
 * `DataTable`'s value starts where its generated label starts, a line whose words are all an `::after`'s is
 * measured by them, a dot a `::before` draws by its fill is a mark, `generated: false` measures without them, and
 * the page is put back after each measure.
 * Products copy `support/insets.mjs`; this check holds it.
 */
const widths = [1440, 390];

async function open(browser, consumer, width) {
	const opened = await browser.open(consumer, { file: 'measure.html', viewport: { width, height: 900 }, prepare: context => Insets.install(context) });
	await opened.page.evaluate(() => document.fonts.ready);
	return opened;
}

export const checks = [
	{
		name: 'measure: what a stylesheet generates is read, a stacked DataTable\'s labels, an ::after\'s words and a ::before\'s dot, and the page is put back (0.44.0)',
		consumers: ['dom'],
		run: async (browser, consumer) => {
			for (const width of widths) {
				const { page } = await open(browser, consumer, width);
				const cell = { box: '#stacked td[data-label]:not([data-empty])' };
				const labelled = await Insets.measure(page, cell);
				const bare = await Insets.measure(page, { ...cell, generated: false });
				const said = await Insets.measure(page, { box: '#said' });
				const none = await Insets.measure(page, { box: '#said', generated: false });
				const fits = await Insets.measure(page, { box: '#fits' });
				const marked = await Insets.measure(page, { box: '#marked' });
				const unmarked = await Insets.measure(page, { box: '#marked', generated: false });
				const back = await page.evaluate(() => {
					const cell = document.querySelector('#stacked td[data-label]:not([data-empty])');
					return { marked: document.querySelectorAll('[data-inset-before], [data-inset-after]').length, text: cell.textContent, before: getComputedStyle(cell, '::before').content, after: getComputedStyle(document.querySelector('#said p'), '::after').content };
				});
				const at = `${browser.engine} ${width}px: ${JSON.stringify({ labelled, bare, said, none, fits, marked, unmarked, back })}`;
				expect(/State/.test(labelled.by.left) && Math.abs(labelled.left) <= 0.5, `${at}: a stacked value starts where its generated label does`);
				expect(/Running/.test(bare.by.left) && bare.left > 10, `${at}: without them it starts at the value's own words`);
				expect(!said.empty && /Last updated/.test(said.by.left) && Math.abs(said.left - 16) <= 0.5 && Math.abs(said.top - fits.top) <= 0.5, `${at}: a line of an ::after's words is measured by them, as a line of text`);
				expect(none.empty, `${at}: without them the line is empty`);
				expect(/^span/.test(marked.by.left) && Math.abs(marked.left - 16) <= 0.5, `${at}: a dot a ::before draws by its fill is a mark at the line's start`);
				expect(/Ready/.test(unmarked.by.left) && Math.abs(unmarked.left - 30) <= 0.5, `${at}: without it the line starts at its words`);
				expect(back.marked === 0 && back.text === 'Running' && back.before !== 'none' && back.after !== 'none', `${at}: the page is put back`);
				await page.close();
			}
		}
	},
	{
		name: 'measure: a background that draws only a divider is no fill; one that fills the row, or a thin layer that repeats, is',
		consumers: ['dom'],
		run: async (browser, consumer) => {
			for (const width of widths) {
				const { page } = await open(browser, consumer, width);
				const lined = await Insets.measure(page, { box: '#lined' });
				const filled = await Insets.measure(page, { box: '#filled' });
				const repeated = await Insets.measure(page, { box: '#repeated' });
				const said = `${browser.engine} ${width}px: ${JSON.stringify({ lined, filled, repeated })}`;
				expect(/Prepare storefront/.test(lined.by.left) && Math.abs(lined.left - 24) <= 0.5, `${said}: the divided row is measured by its words, one padding in`);
				expect(/measure-filled/.test(filled.by.left) && Math.abs(filled.left - 16) <= 0.5, `${said}: the filled row is measured by its fill`);
				expect(/measure-repeated/.test(repeated.by.left) && Math.abs(repeated.left - 16) <= 0.5, `${said}: a 1 px layer that repeats is a fill`);
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
				const clamped = await Insets.measure(page, { box: '#clamped' });
				const fits = await Insets.measure(page, { box: '#fits' });
				const marked = await Insets.measure(page, { box: '#marked' });
				const unmarked = await Insets.measure(page, { box: '#marked', generated: false });
				expect(Math.abs(clamped.top - fits.top) <= 0.5 && Math.abs(clamped.bottom - fits.bottom) <= 0.5, `${said}: a clamp's hidden lines decide no side, ${JSON.stringify({ clamped, fits })}`);
			}
		}
	}
];
