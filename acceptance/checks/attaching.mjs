import { expect, overflow } from '../support/browser.mjs';
import { open } from './thread.mjs';

/**
 * The composer of 0.11.0 in a real engine, on the `thread.html` pages: the state line above the box
 * with its action; the settings chips by keyboard and at 44 px on a touch screen; attachments picked
 * through the platform's chooser, dropped and pasted (synthetic drag and clipboard events carrying a
 * real DataTransfer: no person drags and no system clipboard is read), removed by keyboard and said
 * once per state; and suggestions with real keys, above the docked box, with their bounded states.
 */
const words = {
	en: { start: 'Start', model: 'Model', reason: "This engine's route can't enforce it", drop: 'Drop files to attach', uploading: 'shot.png uploading', attached: 'shot.png attached', failed: 'Larger than 10 MB', retry: 'Retry', late: 'Unavailable · didn’t answer in time', unread: 'Unavailable · couldn’t be read', looking: 'Looking…' },
	es: { start: 'Iniciar', model: 'Modelo', reason: 'La ruta de este motor no puede imponerlo', drop: 'Suelta los archivos para adjuntarlos', uploading: 'shot.png subiéndose', attached: 'shot.png adjuntado', failed: 'Más de 10 MB', retry: 'Reintentar', late: 'No disponible · no respondió a tiempo', unread: 'No disponible · no se pudo leer', looking: 'Buscando…' }
};
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const dock = '.dock .bui-composer';
const logged = (page, text) => page.waitForFunction(entry => window.fixture.log.some(line => line.startsWith(entry)), text);

export const checks = [
	{
		name: 'composer state line above the box with its action at its end; settings chips at the toolbar\'s start, wrapping at 320 px with compact: false (the 0.11.0 toolbar); both themes',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			for (const scheme of ['light', 'dark']) {
				for (const width of [1440, 390, 320]) {
					const at = `${width}px ${scheme}`;
					const { page, context } = await open(browser, consumer, { width, colorScheme: scheme, query: '?compact=off' });
					const found = await page.evaluate(selector => {
						const root = document.querySelector(selector);
						const box = node => node.getBoundingClientRect();
						const line = root.querySelector('.bui-composer-line');
						const action = line.querySelector('.bui-composer-status-action');
						const chips = [...root.querySelectorAll('.bui-composer-settings .bui-chip')].map(box);
						const pad = parseFloat(getComputedStyle(line).paddingInlineEnd) || 0;
						return { pad, line: box(line), box: box(root.querySelector('.bui-composer-box')), action: box(action), chips, root: box(root), start: box(root.querySelector('.bui-composer-start')), end: box(root.querySelector('.bui-composer-end')) };
					}, dock);
					expect(found.line.bottom <= found.box.top + 0.5, `${at}: the line above the box: ${found.line.bottom} > ${found.box.top}`);
					expect(Math.abs(found.action.right - (found.line.right - found.pad)) <= 1, `${at}: its action at its end: ${found.action.right} for ${found.line.right - found.pad}`);
					expect(found.chips.length === 2 && found.chips.every(chip => chip.left >= found.root.left - 0.5 && chip.right <= found.root.right + 0.5), `${at}: the chips inside the composer`);
					if (width <= 390) expect(found.start.bottom <= found.end.top + 1, `${at}: the start takes a row of its own`);
					expect(!(await overflow(page)), `${at}: no sideways scroll`);
					await page.locator(`${dock} .bui-composer-status-action button`, { hasText: copy.start }).click();
					await logged(page, 'start');
					await context.close();
				}
			}
		}
	},
	{
		name: 'settings chips by keyboard: ArrowDown opens on the chosen option, a disabled level says its reason and is never chosen, Enter chooses and focus returns; 44 px targets on a touch screen',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const model = page.locator(`${dock} .bui-chip`).first().locator('.bui-choice-button');
			const state = await model.evaluate(node => [...node.querySelectorAll('.bui-chip-state')].map(word => ({ text: word.textContent.trim(), dot: Boolean(word.querySelector('.bui-status-dot')) })));
			expect(state.length === 1 && state[0].text && state[0].dot, `the state in words with its dot beside it: ${JSON.stringify(state)}`);
			await model.focus();
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			await logged(page, 'model:sonnet');
			expect(await model.evaluate(node => document.activeElement === node), 'focus back on the chip');
			const autonomy = page.locator(`${dock} .bui-chip`).nth(1).locator('.bui-choice-button');
			await autonomy.focus();
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('End');
			const reason = await page.evaluate(() => document.activeElement.textContent);
			expect(reason.includes(copy.reason), `the disabled level says why: ${reason}`);
			await page.keyboard.press('Enter');
			expect(!(await page.evaluate(() => window.fixture.log.some(line => line.startsWith('autonomy:')))), 'never chosen');
			await page.keyboard.press('Escape');
			const touch = await open(browser, consumer, { width: 390, height: 844, hasTouch: true, isMobile: true });
			const small = await touch.page.evaluate(selector => [...document.querySelectorAll(`${selector} button`)].filter(node => node.getClientRects().length).map(node => node.getBoundingClientRect()).filter(box => box.height < 44 || box.width < 44).map(box => [box.width, box.height]), dock);
			expect(!small.length, `targets under 44 px on a touch screen: ${JSON.stringify(small)}`);
		}
	},
	{
		name: 'attachments: Attach opens the platform chooser, chips go from uploading to ready with their size and are said once each; a failed one says why with Retry; Remove by keyboard moves focus on, then to the field',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator(`${dock} .bui-composer-attach`).click()]);
			expect(chooser.isMultiple(), 'more than one file at a time');
			await chooser.setFiles([{ name: 'shot.png', mimeType: 'image/png', buffer: png }, { name: 'big.png', mimeType: 'image/png', buffer: png }]);
			await logged(page, 'files:pick:shot.png,big.png');
			const said = [];
			await page.exposeFunction('heard', text => said.push(text));
			await page.evaluate(selector => new MutationObserver(() => window.heard(document.querySelector(`${selector} > .bui-announcer`).textContent)).observe(document.querySelector(`${selector} > .bui-announcer`), { childList: true, characterData: true, subtree: true }), dock);
			await page.waitForSelector(`${dock} .bui-composer-file[data-state="failed"]`);
			await page.waitForSelector(`${dock} .bui-composer-file[data-state="ready"]`);
			const chips = await page.evaluate(selector => [...document.querySelectorAll(`${selector} .bui-composer-file`)].map(chip => ({ state: chip.dataset.state, meta: chip.querySelector('.bui-composer-file-meta').textContent, image: Boolean(chip.querySelector('img')), retry: !chip.querySelector('.bui-composer-file-retry').hidden })), dock);
			expect(chips[0].state === 'ready' && /B$/.test(chips[0].meta) && chips[0].image, `a ready image with its size and thumbnail: ${JSON.stringify(chips[0])}`);
			expect(chips[1].state === 'failed' && chips[1].meta.includes(copy.failed) && chips[1].retry, `a failed one with its reason and Retry: ${JSON.stringify(chips[1])}`);
			expect((await page.locator(`${dock} > .bui-announcer`).getAttribute('aria-live')) === 'polite', 'said politely');
			await page.waitForTimeout(100);
			expect(said.filter(text => text.includes(copy.attached)).length === 1 && !said.some(text => /%/.test(text)), `each state said once, never the progress: ${JSON.stringify(said)}`);
			await page.locator(`${dock} .bui-composer-file[data-state="failed"] .bui-composer-file-retry`).click();
			await logged(page, 'retry:big.png');
			await page.waitForFunction(selector => document.querySelectorAll(`${selector} .bui-composer-file[data-state="ready"]`).length === 2, dock);
			await page.locator(`${dock} .bui-composer-file-remove`).first().focus();
			await page.keyboard.press('Enter');
			await page.waitForFunction(selector => document.querySelectorAll(`${selector} .bui-composer-file`).length === 1, dock);
			expect(await page.evaluate(selector => document.querySelector(`${selector} .bui-composer-files`).contains(document.activeElement), dock), 'focus on the chip now at its place');
			await page.keyboard.press('Enter');
			await page.waitForFunction(selector => !document.querySelector(`${selector} .bui-composer-file`), dock);
			expect(await page.evaluate(selector => document.activeElement === document.querySelector(`${selector} .bui-composer-field`), dock), 'then the field');
		}
	},
	{
		name: 'attachments: dragging files over the composer shows the drop target and a drop attaches; dragged text does not; a pasted image attaches and pasted text stays text',
		consumers: ['dom', 'react19'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const files = await page.evaluateHandle(() => {
				const data = new DataTransfer();
				data.items.add(new File(['x'], 'dropped.png', { type: 'image/png' }));
				return data;
			});
			const root = page.locator(dock);
			await root.dispatchEvent('dragenter', { dataTransfer: files });
			await root.dispatchEvent('dragover', { dataTransfer: files });
			const target = page.locator(`${dock} .bui-composer-drop`);
			expect(await target.isVisible(), 'the drop target shows');
			expect((await target.textContent()) === copy.drop, 'and says what a drop does');
			await root.dispatchEvent('drop', { dataTransfer: files });
			await logged(page, 'files:drop:dropped.png');
			expect(!(await target.isVisible()), 'gone after the drop');
			const text = await page.evaluateHandle(() => {
				const data = new DataTransfer();
				data.setData('text/plain', 'words');
				return data;
			});
			await root.dispatchEvent('dragenter', { dataTransfer: text });
			expect(!(await target.isVisible()), 'dragged text is not a file');
			const pasted = await page.evaluate(selector => {
				const field = document.querySelector(`${selector} .bui-composer-field`);
				const paste = (data) => {
					const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data });
					// An engine that ignores clipboardData in the constructor (WebKit), or keeps only its text
					// (Firefox), gets the same data as a property
					if (event.clipboardData?.files.length !== data.files.length || event.clipboardData?.types.length !== data.types.length) Object.defineProperty(event, 'clipboardData', { value: data });
					field.dispatchEvent(event);
					return event.defaultPrevented;
				};
				const image = new DataTransfer();
				image.items.add(new File(['x'], 'pasted.png', { type: 'image/png' }));
				const words = new DataTransfer();
				words.setData('text/plain', 'a sentence');
				return { image: paste(image), text: paste(words) };
			}, dock);
			await logged(page, 'files:paste:pasted.png');
			expect(pasted.image && !pasted.text, `a pasted image attaches, pasted text stays text: ${JSON.stringify(pasted)}`);
		}
	},
	{
		name: 'suggestions with real keys: @ lists files above the docked box, arrows move, Enter inserts and sends nothing, Escape closes, Enter then sends; refused and silent sources said unavailable',
		consumers: ['dom', 'react19', 'react18'],
		async run(browser, consumer) {
			const copy = words[consumer.language];
			const { page } = await open(browser, consumer);
			const field = page.locator(`${dock} .bui-composer-field`);
			await field.click();
			await page.keyboard.type('Read @check');
			const list = page.locator(`${dock} [role="listbox"]`);
			await list.locator('[role="option"]').first().waitFor();
			const placed = await page.evaluate(selector => {
				const panel = document.querySelector(`${selector} .bui-composer-suggest`).getBoundingClientRect();
				const box = document.querySelector(`${selector} .bui-composer-box`).getBoundingClientRect();
				return { above: panel.bottom <= box.top + 1, inside: panel.top >= 0 && panel.left >= 0 && panel.right <= innerWidth };
			}, dock);
			expect(placed.above && placed.inside, `above the docked box, inside the window: ${JSON.stringify(placed)}`);
			expect((await field.getAttribute('aria-expanded')) === 'true' && (await field.getAttribute('aria-activedescendant')) === (await list.locator('[role="option"]').first().getAttribute('id')), 'the first option active');
			await page.keyboard.press('ArrowDown');
			const active = await field.getAttribute('aria-activedescendant');
			expect(active === (await list.locator('[role="option"]').nth(1).getAttribute('id')), 'Down moves');
			await page.keyboard.press('Enter');
			expect((await field.inputValue()) === 'Read @src/checkout/session.js ', `inserted: ${await field.inputValue()}`);
			expect(!(await page.evaluate(() => window.fixture.log.some(line => line.startsWith('send:')))), 'nothing sent');
			await page.keyboard.type('and @pay');
			await list.locator('[role="option"]').first().waitFor();
			await page.keyboard.press('Escape');
			expect(!(await list.isVisible()) && (await field.evaluate(node => document.activeElement === node)), 'Escape closes, focus stays');
			await page.keyboard.press('Enter');
			await logged(page, 'send:Read @src/checkout/session.js and @pay');
			for (const [mode, sentence] of [['fail', copy.unread], ['slow', copy.late]]) {
				const view = await open(browser, consumer, { query: `?suggest=${mode}` });
				await view.page.locator(`${dock} .bui-composer-field`).click();
				await view.page.keyboard.type('@src');
				const line = view.page.locator(`${dock} .bui-composer-suggest-line`);
				if (mode === 'slow') await line.filter({ hasText: copy.looking }).waitFor();
				await line.filter({ hasText: sentence }).waitFor({ timeout: 5000 });
				await view.page.keyboard.press('Enter');
				await view.page.waitForFunction(() => window.fixture.log.some(entry => entry.startsWith('send:')));
			}
		}
	}
];
