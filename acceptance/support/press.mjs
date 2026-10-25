/** Two frames and a moment: what a press set in motion has drawn. */
export const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30)))));

/**
 * Presses a control where it rests, as a person does (0.32.0, D183). A quiet control takes none of
 * Playwright's actionability checks, its wait for a still element included, and a page still moves while its
 * inbox and picker load: a press then lands on whatever moved under the pointer.
 */
export async function press(page, locator) {
	await locator.scrollIntoViewIfNeeded();
	let last = null;
	for (let tries = 0; tries < 40; tries += 1) {
		const box = await locator.boundingBox();
		if (box && last && Math.abs(box.x - last.x) < 0.5 && Math.abs(box.y - last.y) < 0.5) return page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
		last = box;
		await settle(page);
	}
	throw new Error('the control kept moving');
}
