import { expect, overflow } from '../support/browser.mjs';
import { open } from './thread.mjs';

/**
 * What 0.11.2 changes in a real engine, on the `thread.html` pages: the composer's toolbar on one row by
 * measured fit from 320 to 2560 px in English and Spanish, with Claude Code's chips and with a running
 * Codex turn's (long chips, Interrupt, Queue); a shortened chip's whole words in the family tooltip;
 * Options saying what sending uses; a drop on the work surface; a refused file that never holds a
 * message back; and a target scrolled into view landing below the compact line.
 */
const words = {
	en: { model: 'Model: GPT-6.1 Sol (default) · Medium · Default', options: 'Options · GPT-6.1 Sol', refused: 'Not attached · Only images and text can be attached', drop: 'Drop files to attach' },
	es: { model: 'Modelo: GPT-6.1 Sol (default) · Medium · Default', options: 'Opciones · GPT-6.1 Sol', refused: 'No adjuntado · Solo se pueden adjuntar imágenes y texto', drop: 'Suelta los archivos para adjuntarlos' }
};
const dock = '.dock .bui-composer';

/** The toolbar's shown leaves and whether they share one row, with the level and the dock's height. */
const row = page =>
	page.evaluate(selector => {
		const root = document.querySelector(selector);
		const bar = root.querySelector('.bui-composer-bar');
		const groups = ['bui-composer-start', 'bui-composer-settings', 'bui-composer-tools', 'bui-composer-end', 'bui-composer-extras'];
		const leaves = [];
		const walk = node => {
			for (const child of node.children) {
				if (child.matches('input, .bui-hidden, [hidden]')) continue;
				if (groups.some(name => child.classList.contains(name)) || getComputedStyle(child).display === 'contents') walk(child);
				else if (child.getClientRects().length) leaves.push({ ...child.getBoundingClientRect().toJSON(), name: child.className.split(' ').at(-1) });
			}
		};
		walk(bar);
		const top = Math.max(...leaves.map(box => box.top));
		const bottom = Math.min(...leaves.map(box => box.bottom));
		const box = root.getBoundingClientRect();
		return { one: top < bottom - 1, level: root.dataset.fit ?? 'full', count: leaves.length, height: Math.round(box.height), width: Math.round(box.width), chips: root.querySelectorAll('.bui-composer-settings .bui-chip').length, inside: leaves.every(item => item.left >= box.left - 0.5 && item.right <= box.right + 0.5), widths: leaves.map(item => `${item.name}:${Math.round(item.width)}`).join(',') };
	}, dock);

export const checks = [
	{
		name: 'composer toolbar on one row from 320 to 2560 px in both themes, with Claude Code\'s chips and a running Codex turn\'s (Interrupt, Queue); chips shown wherever they fit in words; every item inside the composer',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const seen = [];
			for (const query of ['', '?dock=codex']) {
				for (const width of [320, 390, 768, 1024, 1280, 1440, 1920, 2560]) {
					for (const scheme of width === 1440 ? ['light', 'dark'] : ['light']) {
						const at = `${width}px ${scheme} ${query || 'claude'}`;
						const { page, context } = await open(browser, consumer, { width, height: 900, colorScheme: scheme, query });
						const found = await row(page);
						seen.push(`${width}:${query ? 'codex' : 'claude'}:${found.level}:${found.height}`);
						// A running turn on a phone keeps Interrupt and Queue in words: only there, folded, may its actions take a second row
						expect(found.one || (query && width < 480 && found.level === 'fold'), `${at}: one toolbar row: ${JSON.stringify(found)}`);
						expect(found.inside, `${at}: every item inside the composer: ${JSON.stringify(found)}`);
						// Where Attach, two chips, Interrupt and Queue fit in words once the chips say their value: Spanish's longer words need the thread's whole tier
						const shown = query ? (consumer.language === 'es' ? 1920 : 1280) : 1024;
						if (width >= shown) expect(found.level !== 'fold', `${at}: the chips are shown, not folded: ${JSON.stringify(found)}`);
						if (width >= 1920 && !query) expect(found.level === 'full', `${at}: every word: ${JSON.stringify(found)}`);
						expect(!(await overflow(page)), `${at}: no sideways scroll`);
						await context.close();
					}
				}
			}
			if (process.env.DEBUG) console.log(`     ${consumer.name}: ${seen.join(' ')}`);
		}
	},
	{
		name: "composer: a shortened chip's tooltip says its whole face on hover and on keyboard focus; folded, Options says what sending uses",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 1280, height: 900, query: '?dock=codex' });
			const level = await page.evaluate(selector => document.querySelector(selector).dataset.fit ?? 'full', dock);
			expect(level === 'short', `a running Codex turn at 1280 px shortens its chips: ${level}`);
			const chip = page.locator(`${dock} .bui-composer-settings .bui-choice-button`).first();
			const label = await chip.locator('.bui-choice-label').evaluate(node => ({ width: node.getBoundingClientRect().width, text: node.textContent }));
			expect(label.width <= 1 && label.text, `the label leaves the face, not the name: ${JSON.stringify(label)}`);
			const name = await chip.evaluate(node => node.textContent);
			expect(name.includes(label.text), 'the label stays in the accessible name');
			await chip.hover();
			const hint = page.locator('.bui-hint:not([hidden])');
			await hint.waitFor();
			expect((await hint.textContent()) === copy.model, `the whole face on hover: ${await hint.textContent()}`);
			await page.mouse.move(0, 0);
			await hint.waitFor({ state: 'hidden' });
			await page.locator(`${dock} .bui-composer-field`).focus();
			const tab = browser.engine === 'webkit' ? 'Alt+Tab' : 'Tab';
			await page.keyboard.press(tab);
			await page.keyboard.press(tab);
			expect(await chip.evaluate(node => document.activeElement === node), 'Tab reaches the chip after Attach');
			await hint.waitFor();
			expect((await hint.textContent()) === copy.model, `the whole face on keyboard focus: ${await hint.textContent()}`);
			const narrow = await open(browser, consumer, { width: 390, height: 844, query: '?dock=codex' });
			const more = narrow.page.locator(`${dock} .bui-composer-more`);
			expect((await more.getAttribute('aria-label')) === copy.options, `Options says what sending uses: ${await more.getAttribute('aria-label')}`);
			const shown = await more.evaluate(node => ({ text: node.textContent, width: node.getBoundingClientRect().width }));
			expect(shown.text === 'GPT-6.1 Sol' && shown.width > 44, `beside its glyph: ${JSON.stringify(shown)}`);
		}
	},
	{
		name: 'attachments: files dropped on the thread attach with one target over the work surface and the page stays; a refused video says "Not attached" and Send stays',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer, { width: 1440, height: 900 });
			const address = page.url();
			const files = await page.evaluateHandle(() => {
				const data = new DataTransfer();
				data.items.add(new File(['x'], 'thread.png', { type: 'image/png' }));
				return data;
			});
			const thread = page.locator('#thread');
			await thread.dispatchEvent('dragenter', { dataTransfer: files });
			await thread.dispatchEvent('dragover', { dataTransfer: files });
			const target = page.locator('.bui-composer-zone');
			expect(await target.isVisible(), 'one target over the surface');
			expect((await target.textContent()) === copy.drop, 'saying what a drop does');
			const box = await target.boundingBox();
			expect(box.width > 800 && box.height > 400, `over the thread, not only the composer: ${JSON.stringify(box)}`);
			const prevented = await thread.evaluate((node, data) => {
				const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data });
				node.dispatchEvent(event);
				return event.defaultPrevented;
			}, files);
			expect(prevented, 'the browser does not open the file');
			await page.waitForFunction(() => window.fixture.log.includes('files:drop:thread.png'));
			expect(!(await target.isVisible()), 'gone after the drop');
			expect(page.url() === address, 'the page stays');
			const video = await page.evaluateHandle(() => {
				const data = new DataTransfer();
				data.items.add(new File(['x'.repeat(2048)], 'clip.mp4', { type: 'video/mp4' }));
				return data;
			});
			await page.locator(dock).dispatchEvent('drop', { dataTransfer: video });
			const chip = page.locator(`${dock} .bui-composer-file[data-state="refused"]`);
			await chip.waitFor();
			expect((await chip.locator('.bui-composer-file-meta').textContent()).endsWith(copy.refused), `said: ${await chip.locator('.bui-composer-file-meta').textContent()}`);
			expect(!(await chip.locator('.bui-composer-file-retry').isVisible()), 'no Retry');
			await page.waitForFunction(() => window.fixture.items.every(item => item.state !== 'uploading'));
			await page.locator(`${dock} .bui-composer-field`).fill('With the screenshot');
			await page.keyboard.press('Enter');
			await page.waitForFunction(() => window.fixture.log.some(line => line === 'send:With the screenshot:1'));
		}
	},
	{
		name: "Facts: a long value in words reads under its label from its start, beside the panel's other rows, in both themes",
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const scheme of ['light', 'dark']) {
				const { page, context } = await open(browser, consumer, { width: 1440, height: 900, colorScheme: scheme });
				const found = await page.evaluate(() => {
					const rows = [...document.querySelectorAll('.bui-page-panel .bui-facts-row')];
					const long = rows.find(row => row.hasAttribute('data-long'));
					const short = rows.find(row => !row.hasAttribute('data-long') && !row.querySelector('.bui-facts-action'));
					const box = node => node.getBoundingClientRect();
					return { count: rows.filter(row => row.hasAttribute('data-long')).length, label: box(long.querySelector('dt')), value: box(long.querySelector('.bui-facts-value')), align: getComputedStyle(long.querySelector('.bui-facts-data')).textAlign, beside: box(short.querySelector('dt')).top === box(short.querySelector('.bui-facts-value')).top || Math.abs(box(short.querySelector('dt')).top - box(short.querySelector('.bui-facts-value')).top) < 2 };
				});
				expect(found.count === 1, `one long row: ${found.count}`);
				expect(found.value.top >= found.label.bottom - 0.5 && Math.abs(found.value.left - found.label.left) <= 1, `${scheme}: under its label, from its start: ${JSON.stringify(found)}`);
				expect(found.align === 'start', `${scheme}: read from its start: ${found.align}`);
				expect(found.beside, `${scheme}: a short value stays beside its label`);
				await context.close();
			}
		}
	},
	{
		name: 'a target scrolled into view lands below the compact line at 1440 and 390 px',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			for (const width of [1440, 390]) {
				const { page, context } = await open(browser, consumer, { width, height: 844 });
				await page.evaluate(() => window.scrollTo(0, 900));
				await page.waitForSelector('.bui-page-compact[data-shown]', { state: 'attached' });
				const found = await page.evaluate(async () => {
					const target = document.querySelectorAll('#thread .answer')[12];
					target.scrollIntoView({ block: 'start' });
					await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
					const line = document.querySelector('.bui-page-compact-line').getBoundingClientRect();
					return { target: target.getBoundingClientRect().top, line: line.bottom, shown: document.querySelector('.bui-page-compact').hasAttribute('data-shown') };
				});
				expect(found.shown && found.target >= found.line - 0.5, `${width}px: the target's top ${found.target} is below the line's bottom ${found.line}`);
				await context.close();
			}
		}
	}
];
