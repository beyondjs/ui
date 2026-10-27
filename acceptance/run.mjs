import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Consumer } from './support/consumer.mjs';
import { Browser } from './support/browser.mjs';
import { checks as disclosure } from './checks/disclosure-flow.mjs';
import { checks as keyboard } from './checks/keyboard.mjs';
import { checks as picker } from './checks/picker.mjs';
import { checks as notifications } from './checks/notifications.mjs';
import { checks as help } from './checks/help.mjs';
import { checks as presentation } from './checks/presentation.mjs';
import { checks as strict } from './checks/strict.mjs';
import { checks as family } from './checks/family.mjs';
import { checks as icons } from './checks/icons.mjs';
import { checks as navigation } from './checks/navigation.mjs';
import { checks as sidebar } from './checks/sidebar.mjs';
import { checks as operations } from './checks/operations.mjs';
import { checks as layout } from './checks/layout.mjs';
import { checks as pinning } from './checks/pinning.mjs';
import { checks as choosing } from './checks/choosing.mjs';
import { checks as prose } from './checks/prose.mjs';
import { checks as session } from './checks/session.mjs';
import { checks as composing } from './checks/composing.mjs';
import { checks as panels } from './checks/panels.mjs';
import { checks as thread } from './checks/thread.mjs';
import { checks as attaching } from './checks/attaching.mjs';
import { checks as folding } from './checks/folding.mjs';
import { checks as fitting } from './checks/fitting.mjs';
import { checks as diffing } from './checks/diffing.mjs';
import { checks as railing } from './checks/railing.mjs';
import { checks as laning } from './checks/laning.mjs';
import { checks as turning } from './checks/turning.mjs';
import { checks as ending } from './checks/ending.mjs';
import { checks as anchoring } from './checks/anchoring.mjs';
import { checks as moving } from './checks/moving.mjs';
import { checks as seeking } from './checks/seeking.mjs';
import { checks as editing } from './checks/editing.mjs';
import { checks as auditing } from './checks/auditing.mjs';
import { checks as commanding } from './checks/commanding.mjs';
import { checks as holding } from './checks/holding.mjs';
import { checks as navigating } from './checks/navigation-rail.mjs';
import { checks as dismissal } from './checks/dismissal.mjs';
import { checks as sheets } from './checks/sheet-motion.mjs';
import { checks as dialogs } from './checks/dialog-motion.mjs';
import { checks as recovery } from './checks/recovery-details.mjs';
import { checks as recovering } from './checks/recovering.mjs';
import { checks as hierarchy } from './checks/hierarchy.mjs';
import { checks as missing } from './checks/missing.mjs';
import { checks as waiting } from './checks/waiting.mjs';
import { checks as settling } from './checks/settling.mjs';
import { checks as insets } from './checks/insets.mjs';
import { checks as closing } from './checks/closing.mjs';
import { checks as focusing } from './checks/focusing.mjs';
import { checks as pressing } from './checks/pressing.mjs';
import { checks as revealing } from './checks/revealing.mjs';
import { checks as targeting } from './checks/targeting.mjs';
import { checks as hanging } from './checks/hanging.mjs';
import { checks as measuring } from './checks/measuring.mjs';

/**
 * Browser acceptance of the packed package: `npm pack` → three consumers installed from the tarball
 * (plain DOM, React 19, React 18) → every check in Google Chrome → a count of what passed. Temporary
 * projects, servers and the browser are removed on success and failure. Exit code 1 on any failure.
 */
class Acceptance {
	#root = fileURLToPath(new URL('..', import.meta.url));
	#consumers = [new Consumer('dom', 'dom'), new Consumer('react19', 'react', '19.3.0'), new Consumer('react18', 'react', '18.3.1')];
	#checks = [...disclosure, ...keyboard, ...picker, ...notifications, ...help, ...presentation, ...strict, ...family, ...navigation, ...sidebar, ...operations, ...layout, ...pinning, ...choosing, ...icons, ...prose, ...session, ...composing, ...panels, ...thread, ...attaching, ...folding, ...fitting, ...diffing, ...railing, ...laning, ...turning, ...missing, ...ending, ...anchoring, ...moving, ...seeking, ...editing, ...auditing, ...commanding, ...holding, ...navigating, ...hierarchy, ...dismissal, ...sheets, ...dialogs, ...recovery, ...recovering, ...waiting, ...insets, ...settling, ...closing, ...focusing, ...pressing, ...revealing, ...targeting, ...hanging, ...measuring];
	// Checks whose consumer and name hold the filter, or any of its parts separated by `|` (0.33.0)
	#filters = (process.argv[2] ?? '').split('|').filter(Boolean);

	async run() {
		const work = mkdtempSync(join(tmpdir(), 'ui pack-'));
		const browser = new Browser();
		const results = [];
		try {
			const supplied = process.env.BEYOND_UI_TARBALL;
			const name = supplied ?? execFileSync('npm', ['pack', '--pack-destination', work, '--loglevel=error'], { cwd: this.#root, encoding: 'utf8' }).trim().split('\n').at(-1);
			const tarball = supplied ? resolve(this.#root, supplied) : join(work, name);
			const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
			console.log(`Packed ${name} (${integrity})`);
			await Promise.all(this.#consumers.map(consumer => consumer.prepare(tarball)));
			for (const consumer of this.#consumers) console.log(`Consumer ${consumer.name}: ${JSON.stringify(consumer.installed)}`);
			await browser.launch();
			console.log(`Browser: ${browser.engine} ${browser.version}`);
			for (const check of this.#checks) {
				for (const consumer of this.#consumers.filter(item => check.consumers.includes(item.name))) {
					if (this.#filters.length && !this.#filters.some(filter => `${consumer.name} ${check.name}`.includes(filter))) continue;
					results.push(await this.#one(browser, check, consumer));
				}
			}
		} finally {
			await browser.close();
			await Promise.all(this.#consumers.map(consumer => consumer.dispose()));
			rmSync(work, { recursive: true, force: true });
		}
		const failed = results.filter(result => !result.passed);
		console.log(`\n${results.length - failed.length} passed, ${failed.length} failed, ${results.length} checks`);
		process.exitCode = failed.length ? 1 : 0;
	}

	async #one(browser, check, consumer) {
		const opened = [];
		let timer;
		const tracked = { engine: browser.engine, open: async (...args) => { const view = await browser.open(...args); opened.push(view); return view; } };
		try {
			await Promise.race([check.run(tracked, consumer), new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error('Check exceeded 120 seconds')), 120_000);
			})]);
			const errors = opened.flatMap(view => view.errors);
			if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
			console.log(`ok   ${consumer.name.padEnd(8)} ${check.name}`);
			return { passed: true };
		} catch (error) {
			console.log(`FAIL ${consumer.name.padEnd(8)} ${check.name}\n     ${process.env.DEBUG ? error.message : error.message.split('\n')[0]}`);
			return { passed: false };
		} finally {
			clearTimeout(timer);
			await Promise.all(opened.map(view => view.context.close().catch(() => {})));
		}
	}
}

await new Acceptance().run();
