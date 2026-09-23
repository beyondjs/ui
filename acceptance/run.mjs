import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Consumer } from './support/consumer.mjs';
import { Browser } from './support/browser.mjs';
import { checks as keyboard } from './checks/keyboard.mjs';
import { checks as picker } from './checks/picker.mjs';
import { checks as notifications } from './checks/notifications.mjs';
import { checks as help } from './checks/help.mjs';
import { checks as presentation } from './checks/presentation.mjs';
import { checks as strict } from './checks/strict.mjs';

/**
 * Browser acceptance of the packed package: `npm pack` → three consumers installed from the tarball
 * (plain DOM, React 19, React 18) → every check in Google Chrome → a count of what passed. Temporary
 * projects, servers and the browser are removed on success and failure. Exit code 1 on any failure.
 */
class Acceptance {
	#root = fileURLToPath(new URL('..', import.meta.url));
	#consumers = [new Consumer('dom', 'dom'), new Consumer('react19', 'react', '19.3.0'), new Consumer('react18', 'react', '18.3.1')];
	#checks = [...keyboard, ...picker, ...notifications, ...help, ...presentation, ...strict];
	#filter = process.argv[2] ?? '';

	async run() {
		const work = mkdtempSync(join(tmpdir(), 'ui pack-'));
		const browser = new Browser();
		const results = [];
		try {
			const name = execFileSync('npm', ['pack', '--pack-destination', work, '--loglevel=error'], { cwd: this.#root, encoding: 'utf8' }).trim().split('\n').at(-1);
			const tarball = join(work, name);
			const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
			console.log(`Packed ${name} (${integrity})`);
			await Promise.all(this.#consumers.map(consumer => consumer.prepare(tarball)));
			for (const consumer of this.#consumers) console.log(`Consumer ${consumer.name}: ${JSON.stringify(consumer.installed)}`);
			await browser.launch();
			console.log(`Browser: Chrome ${browser.version}`);
			for (const check of this.#checks) {
				for (const consumer of this.#consumers.filter(item => check.consumers.includes(item.name))) {
					if (this.#filter && !`${consumer.name} ${check.name}`.includes(this.#filter)) continue;
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
		const tracked = { open: async (...args) => { const view = await browser.open(...args); opened.push(view); return view; } };
		try {
			await check.run(tracked, consumer);
			const errors = opened.flatMap(view => view.errors);
			if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
			console.log(`ok   ${consumer.name.padEnd(8)} ${check.name}`);
			return { passed: true };
		} catch (error) {
			console.log(`FAIL ${consumer.name.padEnd(8)} ${check.name}\n     ${process.env.DEBUG ? error.message : error.message.split('\n')[0]}`);
			return { passed: false };
		} finally {
			await Promise.all(opened.map(view => view.context.close().catch(() => {})));
		}
	}
}

await new Acceptance().run();
