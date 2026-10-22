import { expect } from '../support/browser.mjs';

/** Actual rendered geometry, including a controlled reversal before removal. */
export const checks = [{
	name: 'sheet motion: native exit frames, backdrop fade, reversal, focus and reduced motion',
	consumers: ['dom', 'react19', 'react18'],
	async run(browser, consumer) {
		for (const reducedMotion of ['no-preference', 'reduce']) {
			const { page } = await browser.open(consumer, { file: 'choosing.html', viewport: { width: 1440, height: 900 }, reducedMotion });
			const opener = page.locator('#sheeting > .bui-button');
			const sheet = page.locator('dialog.bui-sheet[open]');
			await opener.click(); await sheet.waitFor();
			const entry = await sheet.evaluate(async node => {
				const read = () => ({ x: node.getBoundingClientRect().x, veil: Number(getComputedStyle(node, '::backdrop').opacity), animation: getComputedStyle(node).animationName });
				const start = read();
				await Promise.all(node.getAnimations().map(item => item.finished));
				return { start, end: read() };
			});
			expect(reducedMotion === 'reduce' ? entry.start.animation === 'none' : entry.start.animation === 'bui-sheet-in', 'entry honors motion preference');
			if (reducedMotion === 'no-preference') {
				// Begin closing, capture a genuinely intermediate frame, then reverse the same surface.
				const during = await sheet.evaluate(node => new Promise(resolve => {
					const began = performance.now();
					window.fixture.open(false);
					const frame = () => {
						const veil = Number(getComputedStyle(node, '::backdrop').opacity);
						if ((node.dataset.motion === 'out' && veil < 0.95) || !node.open || performance.now() - began > 500) {
							const result = { x: node.getBoundingClientRect().x, veil, node: node.isConnected && node.open };
							window.fixture.open(true);
							resolve(result);
						} else requestAnimationFrame(frame);
					}; requestAnimationFrame(frame);
				}));
				expect(during.node, 'native sheet survives into an intermediate exit frame');
				await page.waitForFunction(() => document.querySelector('.bui-sheet')?.dataset.motion !== 'out');
				const reversed = await sheet.evaluate(async node => {
					const start = { x: node.getBoundingClientRect().x, veil: Number(getComputedStyle(node, '::backdrop').opacity), inert: node.inert };
					await Promise.all(node.getAnimations().map(item => item.finished));
					return { start, x: node.getBoundingClientRect().x, veil: Number(getComputedStyle(node, '::backdrop').opacity) };
				});
				expect(!reversed.start.inert && reversed.start.x < 1439, 'reopen cancels exit without restarting outside the viewport');
				expect(Math.abs(reversed.x - entry.end.x) < 1 && reversed.veil === 1, 'reopen ends at the original resting geometry');
				expect(await page.locator('.bui-sheet').count() === 1, 'reversal has one sheet');
				expect(await page.evaluate(() => !window.fixture.log.includes('sheet:null')), 'interrupted exit does not notify closure');
			}
			const result = await sheet.evaluate(node => new Promise(resolve => {
				const rows = []; const start = performance.now();
				const read = () => ({ time: performance.now() - start, open: node.open, connected: node.isConnected, x: node.getBoundingClientRect().x, veil: Number(getComputedStyle(node, '::backdrop').opacity), inert: node.inert });
				node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
				const immediate = read();
				const frame = () => {
					const row = read(); rows.push(row);
					if (!row.open || row.time > 600) resolve({ immediate, rows });
					else requestAnimationFrame(frame);
				}; requestAnimationFrame(frame);
			}));
			const alive = result.rows.filter(row => row.open);
			if (reducedMotion === 'reduce') expect(!result.immediate.open, 'reduced motion closes immediately');
			else {
				expect(alive.length >= 2 && alive.every(row => row.connected && row.inert), 'native modal survives multiple inert exit frames');
				expect(alive.at(-1).x > alive[0].x + 20, 'drawer slides toward its edge');
				expect(alive.some(row => row.veil > 0 && row.veil < 1), 'native backdrop fades');
				expect(!result.rows.at(-1).open && result.rows.at(-1).time < 450, 'exit completes within bound');
			}
			await sheet.waitFor({ state: 'hidden' });
			expect(await opener.evaluate(node => node === document.activeElement), 'focus returns after exit');
			expect(await page.locator('.bui-sheet.bui-leaving, .bui-sheet-veil').count() === 0, 'no detached picture or scrim');
		}
	}
}];
