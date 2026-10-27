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

/**
 * A checklist's own words (0.42.0): in the widest checklist, 40rem first in a page's main column as the Packages
 * interface's arrival draws it, each step's detail and a blocked step's reason are held at the reading measure.
 * Each part's measure is 54ch at its own size, its own words stay within 80 characters a line, and a long
 * paragraph given to it does too. Before 0.42.0 a detail took the checklist's width: the arrival's longest
 * detail ran to 81 characters on one line from 1024 px.
 */
const steps = (page, text) =>
	page.evaluate(text => {
		const range = document.createRange();
		/** The characters of each rendered line, and how many lines. */
		const measure = node => {
			const lines = new Map();
			for (let index = 0; index < node.firstChild.length; index++) {
				range.setStart(node.firstChild, index);
				range.setEnd(node.firstChild, index + 1);
				const box = range.getClientRects()[0];
				if (!box) continue;
				lines.set(Math.round(box.top), (lines.get(Math.round(box.top)) ?? 0) + 1);
			}
			return { longest: Math.max(0, ...lines.values()), lines: lines.size };
		};
		const list = document.querySelector('.bui-checklist');
		const parts = [...document.querySelectorAll('.bui-checklist-detail, .bui-checklist-reason')];
		const found = [];
		for (const node of parts) {
			const name = node.className.split(' ').find(item => item.startsWith('bui-checklist-'));
			const step = node.closest('[data-key]').dataset.key;
			const cap = getComputedStyle(node).maxWidth;
			const before = node.textContent;
			const own = measure(node);
			node.textContent = text;
			const long = measure(node);
			node.textContent = before;
			const room = parseFloat(cap);
			// The reading measure at the part's own size: 54 zeros in its font, as `54ch` resolves there
			const zeros = node.appendChild(document.createElement('span'));
			zeros.style.cssText = 'position: absolute; white-space: pre; visibility: hidden';
			zeros.textContent = '0'.repeat(54);
			const expected = zeros.getBoundingClientRect().width;
			zeros.remove();
			if (!Number.isFinite(room)) found.push(`${step} ${name}: no measure (max-width ${cap})`);
			else if (Math.abs(room - expected) > 1) found.push(`${step} ${name}: a measure of ${room.toFixed(1)} px, not 54ch at its own size (${expected.toFixed(1)} px)`);
			if (own.longest > 80) found.push(`${step} ${name}: its own words run to ${own.longest} characters a line`);
			if (long.longest > 80) found.push(`${step} ${name}: a long paragraph runs to ${long.longest} characters a line`);
			if (long.lines < 3) found.push(`${step} ${name}: a long paragraph took ${long.lines} lines`);
		}
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		return { width: list.getBoundingClientRect().width, form: 40 * rem, parts: parts.map(node => node.className), found };
	}, text);

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
	},
	{
		name: 'prose: a checklist\'s detail and a blocked step\'s reason keep the reading measure in the widest checklist, at 1024, 1440 and 1920 px',
		consumers: ['dom'],
		async run(browser, consumer) {
			const found = [];
			for (const width of [1024, 1440, 1920]) {
				const { page, context, errors } = await browser.open(consumer, { file: 'layout.html', query: '?first=1', viewport: { width, height: 1000 } });
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(300);
				const result = await steps(page, paragraph);
				expect(!errors.length, `${width} px: ${errors.join('; ')}`);
				expect(Math.abs(result.width - result.form) < 1, `${width} px: the checklist is at its widest, 40rem: ${result.width.toFixed(1)} px of ${result.form} px`);
				expect(result.parts.filter(name => name.includes('detail')).length === 3 && result.parts.some(name => name.includes('reason')), `${width} px: three details and a reason to measure: ${result.parts.join(', ')}`);
				found.push(...result.found.map(entry => `${width} px: ${entry}`));
				await context.close();
			}
			expect(!found.length, `a checklist's words past the reading measure: ${found.join('; ')}`);
			return '4 parts at 3 widths';
		}
	}
];
