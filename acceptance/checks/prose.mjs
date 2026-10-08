import { expect } from '../support/browser.mjs';

/**
 * Every block of prose the package draws keeps to the reading measure (LR-02, token set 0.3.1): on each
 * fixture page at 1920 px, each block that holds only text is given a long paragraph and the characters
 * of each of its rendered lines are counted. A block that a product fills with its own words (a field's
 * hint, a refusal's reason, a step's reason) must stop at about 80 characters wherever it sits.
 */
const paragraph = 'A public repository needs none for Conduict; Delegate reads every repository with one, and it is kept in Beyond Projects until an owner or an administrator of the organization removes it from every project that uses it, which never deletes the repository on GitHub.';
const pages = ['index.html', 'layout.html', 'choosing.html', 'operations.html', 'family.html', 'conversation.html', 'thread.html'];
// The parts that hold sentences, by their role in the class name; labels, titles, times and counts are not prose
const prose = '^bui-[a-z-]+-(hint|reason|description|note|why|summary|detail|message|text|status|body)$';

const audit = page =>
	page.evaluate(({ text, pattern }) => {
		const prose = new RegExp(pattern);
		const skip = 'table, pre, code, h1, h2, h3, h4, nav, button, a, label, select, option, input, textarea, summary, dialog:not([open]), [hidden], .bui-family, .bui-sidebar, .bui-menu, .bui-navmenu, .bui-tooltip, .bui-badge, .bui-status, .bui-chip';
		const blocks = [...document.querySelectorAll('body *')].filter(node => {
			if (node.closest(skip) || typeof node.className !== 'string' || !node.className.split(' ').some(name => prose.test(name))) return false;
			const own = [...node.childNodes];
			if (!own.length || own.some(child => child.nodeType !== 3) || !node.textContent.trim()) return false;
			const style = getComputedStyle(node);
			return style.display !== 'inline' && style.display !== 'none' && node.getClientRects().length > 0;
		});
		const found = [];
		const range = document.createRange();
		for (const node of blocks) {
			const before = node.textContent;
			node.textContent = text;
			const lines = new Map();
			for (let index = 0; index < node.firstChild.length; index++) {
				range.setStart(node.firstChild, index);
				range.setEnd(node.firstChild, index + 1);
				const box = range.getClientRects()[0];
				if (box) lines.set(Math.round(box.top), (lines.get(Math.round(box.top)) ?? 0) + 1);
			}
			const longest = Math.max(0, ...lines.values());
			if (longest > 80) found.push(`${node.className.split(' ').find(name => name.startsWith('bui-'))} (${longest})`);
			node.textContent = before;
		}
		return { checked: blocks.length, found: [...new Set(found)] };
	}, { text: paragraph, pattern: prose });

export const checks = [
	{
		name: 'prose: every block of text the package draws stops at the reading measure, about 80 characters a line, at 1920 px',
		consumers: ['dom'],
		async run(browser, consumer) {
			const found = [];
			let checked = 0;
			for (const file of pages) {
				const { page, context } = await browser.open(consumer, { file, viewport: { width: 1920, height: 1000 } });
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(300);
				const result = await audit(page);
				checked += result.checked;
				found.push(...result.found.map(entry => `${file}: ${entry}`));
				await context.close();
			}
			expect(checked > 20, `blocks of text were found to check: ${checked}`);
			expect(!found.length, `blocks past 80 characters a line: ${found.join(', ')}`);
			return `${checked} blocks`;
		}
	}
];
