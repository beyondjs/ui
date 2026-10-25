import { expect } from '../support/browser.mjs';
import { RowFrames } from '../support/rows.mjs';

/**
 * The current tab of every row of tabs shows whole (0.35.0, D179), on the `clear.html` pages: a machine's
 * Settings, whose page tabs and Settings tabs are given before the page is in the document as a product appends
 * them, and with `?nav=row` the product's own ProductNav under the bar. Every frame from the first paint, read
 * at the end of its rendering (`RowFrames`), through the web fonts' load and after it: each row's current tab
 * inside the row and under no cue drawn, at 320, 390 and 1440 px. Where a phone's row holds more than it shows,
 * the check asks that it says so, so the cues are really there to clear.
 */
async function frames(browser, consumer, { width, query }) {
	const view = await browser.open(consumer, { file: 'clear.html', query, viewport: { width, height: 800 }, prepare: context => RowFrames.install(context) });
	const samples = await new RowFrames(view.page).read();
	await view.context.close();
	return samples;
}

/** The frames that drew the rows, the first of them, and the last once the fonts had loaded. */
function summary(samples) {
	const drawn = samples.filter(sample => sample.rows.some(row => row.tab && row.row?.width));
	const loaded = drawn.filter(sample => sample.status === 'loaded' && sample.fonts > 0);
	return { drawn, first: drawn[0] ?? null, last: loaded.at(-1) ?? null, before: drawn.filter(sample => !loaded.includes(sample)).length };
}

const cases = [
	{ width: 390, query: '?at=network', rows: 2, more: true },
	{ width: 320, query: '?at=network', rows: 2, more: true },
	{ width: 390, query: '?at=secrets', rows: 2, more: true },
	{ width: 320, query: '?at=use', rows: 2, more: true },
	{ width: 390, query: '?nav=row&at=shutdown', rows: 3, more: true },
	{ width: 320, query: '?merged=1&at=network', rows: 2, more: true },
	{ width: 1440, query: '?at=network', rows: 2, more: false }
];

export const checks = [
	{
		name: 'clear: rows of tabs, the current tab whole and under no cue on every frame from the first paint, before and after the fonts load, at 320, 390 and 1440 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const said = [];
			for (const { width, query, rows, more } of cases) {
				const at = `${width} px ${query}`;
				const samples = await frames(browser, consumer, { width, query });
				const { drawn, first, last, before } = summary(samples);
				expect(first, `${at}: no frame drew the rows (${samples.length} frames)`);
				expect(last, `${at}: the fonts never loaded within the recorder's bound (${drawn.length} frames drew the rows)`);
				expect(first.rows.length === rows, `${at}: ${rows} rows of tabs, found ${first.rows.map(row => row.name).join(', ')}`);
				const cut = RowFrames.cut(drawn);
				const struck = new Set(cut.map(item => item.at)).size;
				expect(!cut.length, `${at}: a current tab was cut on ${struck} of ${drawn.length} frames: ${cut.slice(0, 4).map(item => item.text).join('; ')}`);
				// A phone's row of Settings holds more than it shows, so a cue is there to clear on the first paint and after the fonts
				const settings = sample => sample.rows.find(row => /Settings|Ajustes/.test(row.name)) ?? sample.rows.at(-1);
				if (more) expect(settings(first).more && settings(last).more, `${at}: the Settings row says it holds more: "${settings(first).more}" then "${settings(last).more}"`);
				said.push(`${width}${query}: ${drawn.length} frames, ${before} before the fonts`);
			}
			if (process.env.DEBUG) console.log(`     ${said.join(' | ')}`);
		}
	}
];
