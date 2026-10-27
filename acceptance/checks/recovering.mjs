import { expect, overflow } from '../support/browser.mjs';

/**
 * 0.24.0 (D163) measured in the browser, on the recovery pages: an outage of four reads is one line in
 * the warning tone on the H1's edge (who did not answer, when it last tried and one Try again), each
 * region says it is not available in its own place, kept content says when it was read, the evidence of
 * every read sits in one Technical details that fits a phone, and with nothing to show the notice is the
 * page's body in `Unavailable`'s form. 1440, 390 and 320 px in both themes.
 */
const measure = page =>
	page.evaluate(() => {
		const box = node => node.getBoundingClientRect().toJSON();
		const notice = document.querySelector('.bui-recovery');
		const title = notice.querySelector('.bui-recovery-title');
		const again = notice.querySelector('.bui-again');
		const action = [...notice.querySelectorAll('button')].filter(button => !button.closest('details'));
		const details = notice.querySelector('details');
		const paint = getComputedStyle(notice);
		return {
			form: notice.dataset.recovery,
			notice: box(notice),
			title: box(title),
			titleSize: parseFloat(getComputedStyle(title).fontSize),
			titleTag: title.localName,
			again: box(again),
			action: action.map(box),
			actions: action.length,
			h1: box(document.querySelector('h1')),
			padding: parseFloat(paint.paddingLeft),
			said: [...notice.children].filter(node => !node.matches('details, .bui-hidden')).map(node => node.textContent.trim()).filter(Boolean).join(' '),
			rows: details?.querySelectorAll('tbody tr').length ?? 0,
			places: [...document.querySelectorAll('.bui-section .bui-empty-outage')].map(node => node.textContent),
			boxes: [...document.querySelectorAll('.bui-section .bui-empty-outage')].filter(node => parseFloat(getComputedStyle(node).borderTopWidth) > 0).length,
			kept: document.querySelector('.bui-last-update')?.textContent ?? null,
			viewport: innerWidth
		};
	});

export const checks = [
	{
		name: 'recovery: one line on the H1’s edge, the reads said in their places, one Try again, at 1440, 390 and 320 px in both themes (D163)',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			for (const colorScheme of ['light', 'dark'])
				for (const width of [1440, 390, 320]) {
					const { page, context, errors } = await browser.open(consumer, { file: 'recovery.html', viewport: { width, height: 900 }, colorScheme });
					try {
						await page.evaluate(() => document.fonts.ready);
						await page.locator('.bui-recovery:not([hidden]) .bui-again').waitFor();
						const found = await measure(page);
						const where = `${consumer.name ?? ''} ${width} ${colorScheme}: ${JSON.stringify(found)}`;
						expect(found.form === 'line' && found.titleTag === 'p', `a line, not a heading: ${where}`);
						expect(found.actions === 1, `one Try again: ${where}`);
						expect(!/Machines|Your conversations|Requests|The project/.test(found.said), `the notice lists nothing: ${where}`);
						expect(found.places.length === 2 && found.places.every(text => text === 'Not available right now'), `each region says it in its place: ${where}`);
						expect(found.boxes === 0, `each place is one quiet line, with no box (0.24.1, React since 0.25.1): ${where}`);
						expect(/^Last updated \d\d:\d\d$/.test(found.kept ?? ''), `kept content says when it was read: ${where}`);
						expect(found.rows === 4, `one Technical details with a row per read: ${where}`);
						expect(Math.abs(found.notice.left - found.h1.left) <= 1, `the notice starts on the H1’s edge (D159): ${where}`);
						if (width === 1440) {
							expect(found.again.top < found.title.bottom && found.again.left > found.title.right, `who did not answer and when it last tried on one line: ${where}`);
							const middle = rect => (rect.top + rect.bottom) / 2;
							expect(Math.abs(middle(found.action[0]) - middle(found.title)) <= 6 && found.action[0].left > found.again.right, `Try again at the line’s end: ${where}`);
							expect(found.notice.height <= 110, `one line and its folded evidence, nothing more: ${where}`);
						} else {
							expect(found.action[0].top >= found.title.bottom - 1 && Math.abs(found.action[0].left - found.title.left) <= 1, `on a phone Try again goes under the words, on their edge: ${where}`);
						}
						expect(!(await overflow(page)), `no sideways scroll: ${where}`);
						await page.locator('.bui-recovery details > summary').click();
						const opened = await page.evaluate(() => {
							const body = document.querySelector('.bui-recovery details .bui-details-body').getBoundingClientRect();
							const table = document.querySelector('.bui-recovery details table');
							return { right: body.right, viewport: innerWidth, table: table.scrollWidth <= table.clientWidth + 1 };
						});
						expect(opened.right <= opened.viewport + 1 && opened.table && !(await overflow(page)), `the evidence fits: ${JSON.stringify(opened)} ${where}`);
						expect(errors.length === 0, `no page errors: ${errors.join(' | ')}`);
					} finally {
						await context.close();
					}
				}
		}
	},
	{
		name: 'recovery: with nothing to show the notice is the page’s body in Unavailable’s form, and Try again opens what answered with no reload',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1440, 320]) {
				const { page, context } = await browser.open(consumer, { file: 'recovery.html', query: '?whole=1', viewport: { width, height: 900 } });
				try {
					await page.locator('.bui-recovery:not([hidden])').waitFor();
					const found = await measure(page);
					// What `Unavailable` draws in the same column, measured beside it
					const unavailable = await page.evaluate(() => {
						const probe = document.createElement('section');
						probe.className = 'bui-unavailable bui-unavailable-outage';
						probe.innerHTML = `<span class="bui-unavailable-icon"></span><div class="bui-unavailable-body"><h2 class="bui-unavailable-title">${'Beyond Accounts did not answer '.repeat(4)}</h2></div>`;
						document.querySelector('.bui-recovery').after(probe);
						const result = { width: probe.getBoundingClientRect().width, padding: parseFloat(getComputedStyle(probe).paddingLeft), size: parseFloat(getComputedStyle(probe.querySelector('h2')).fontSize) };
						probe.remove();
						return result;
					});
					expect(found.form === 'page' && found.titleTag === 'h2' && found.titleSize === unavailable.size, `the page form with Unavailable’s heading: ${JSON.stringify({ found, unavailable })}`);
					expect(found.padding === unavailable.padding && found.notice.width <= unavailable.width + 1, `Unavailable’s geometry: ${JSON.stringify({ found, unavailable })}`);
					expect(found.places.length === 0, 'no region says it again under the page form');
				} finally {
					await context.close();
				}
			}
			const { page, context } = await browser.open(consumer, { file: 'recovery.html', viewport: { width: 1440, height: 900 } });
			try {
				const address = page.url();
				await page.evaluate(() => {
					window.fixture.read.answer = true;
				});
				await page.locator('.bui-recovery-actions button').click();
				await page.locator('#answered').waitFor();
				await page.waitForFunction(() => document.querySelector('.bui-recovery')?.hidden || !document.querySelector('.bui-recovery'));
				expect(page.url() === address, 'no reload');
			} finally {
				await context.close();
			}
		}
	},
	{
		name: 'recovery: the Spanish page says it in Spanish, the regions and the kept content included',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'recovery.html', query: '?lang=es', viewport: { width: 1440, height: 900 } });
			try {
				await page.locator('.bui-recovery:not([hidden]) .bui-again').waitFor();
				const found = await measure(page);
				expect(/^Beyond Accounts no respondió/.test(found.said) && /Último intento \d\d:\d\d/.test(found.said) && /Reintentar/.test(found.said), `the line in Spanish: ${found.said}`);
				expect(found.places.every(text => text === 'No disponible en este momento') && /^Última actualización: \d\d:\d\d$/.test(found.kept ?? ''), `the places in Spanish: ${JSON.stringify(found)}`);
				expect((await page.locator('.bui-recovery details > summary').textContent()).includes('Detalles técnicos'), 'Technical details in Spanish');
			} finally {
				await context.close();
			}
		}
	},
	{
		name: 'recovery: a part not drawn leaves no gap: offline at 390 px its evidence follows its words as online it follows Try again (0.44.0)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const { page, context } = await browser.open(consumer, { file: 'recovery.html', viewport: { width: 390, height: 900 } });
			try {
				await page.evaluate(() => document.fonts.ready);
				await page.locator('.bui-recovery:not([hidden]) .bui-again').waitFor();
				const gap = above =>
					page.evaluate(above => {
						const notice = document.querySelector('.bui-recovery');
						return notice.querySelector(':scope > .bui-details').getBoundingClientRect().top - notice.querySelector(above).getBoundingClientRect().bottom;
					}, above);
				const online = await gap('.bui-recovery-actions');
				await context.setOffline(true);
				await page.waitForSelector('.bui-recovery[data-offline]:not([hidden])');
				const offline = await gap('.bui-recovery-words');
				expect(online > 0 && Math.abs(online - offline) <= 0.5, `one gap above the evidence, whatever is drawn before it: ${JSON.stringify({ online, offline })}`);
			} finally {
				await context.close();
			}
		}
	},
	{
		name: 'family bar: a notice that says an outage, in the warning tone with its mark on its first line, when it last tried and Try again, inside its menu at 1280 and 390 px in both themes (0.44.0, D132)',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const [width, colorScheme] of [[1280, 'light'], [390, 'dark']]) {
				const { page, context, errors } = await browser.open(consumer, { file: 'family.html', query: '?family=inside&notice=outage', viewport: { width, height: 800 }, colorScheme });
				try {
					await page.evaluate(() => document.fonts.ready);
					// Below 720 px the organization and the project are one location menu
					await page.locator(':is([data-part="project"], [data-part="location"]) > .bui-navmenu-button:visible').first().click();
					await page.locator(':is([data-part="project"], [data-part="location"]) > .bui-navmenu-panel:not([hidden]) .bui-navmenu-notice').waitFor();
					const found = await page.evaluate(() => {
						const panel = [...document.querySelectorAll(':is([data-part="project"], [data-part="location"]) > .bui-navmenu-panel')].find(node => !node.hidden);
						const line = panel.querySelector('.bui-navmenu-notice');
						const words = line.querySelector('.bui-navmenu-notice-words > span');
						const range = document.createRange();
						range.selectNodeContents(words);
						const first = range.getClientRects()[0];
						const box = node => node.getBoundingClientRect();
						const probe = document.body.appendChild(Object.assign(document.createElement('div'), { style: 'background: var(--color-warning-surface)' }));
						const warning = getComputedStyle(probe).backgroundColor;
						probe.remove();
						const middle = rect => (rect.top + rect.bottom) / 2;
						return {
							tone: line.dataset.tone,
							surface: getComputedStyle(line).backgroundColor === warning,
							mark: middle(box(line.querySelector('.bui-navmenu-notice-mark'))) - middle(first),
							again: line.querySelector('.bui-again')?.textContent ?? null,
							under: box(line.querySelector('.bui-again')).top - first.bottom,
							action: line.querySelector('.bui-navmenu-notice-action')?.textContent ?? null,
							beside: middle(box(line.querySelector('.bui-navmenu-notice-action'))) - middle(first),
							after: box(line.querySelector('.bui-navmenu-notice-action')).left - box(line.querySelector('.bui-navmenu-notice-words')).right,
							inside: box(line).right <= box(panel).right + 0.5 && box(line).left >= box(panel).left - 0.5,
							scroll: panel.scrollWidth - panel.clientWidth
						};
					});
					const where = `${consumer.name} ${width} ${colorScheme}: ${JSON.stringify(found)}`;
					expect(found.tone === 'warning' && found.surface, `the warning tone: ${where}`);
					expect(Math.abs(found.mark) <= 1.5, `the outage's mark on the words' first line: ${where}`);
					expect(/^(Last tried|Último intento) /.test(found.again ?? '') && found.under >= -0.5, `when it last tried, under the words: ${where}`);
					expect(Boolean(found.action) && Math.abs(found.beside) <= 4 && found.after >= 0, `Try again after the words, on their first line: ${where}`);
					expect(found.inside && found.scroll <= 0, `inside its menu, nothing scrolls sideways: ${where}`);
					expect(errors.length === 0, `no page errors: ${errors.join(' | ')}`);
				} finally {
					await context.close();
				}
			}
		}
	}
];
