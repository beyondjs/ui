import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Packs the package for vendoring and, optionally, copies it into consumers.
 *
 * `npm run pack:consumers` writes `dist-pack/beyond-ui-<version>.tgz` (npm's own `npm pack`, which
 * runs the build first) and its `sha512` integrity next to it. Each argument names a consumer
 * directory; the tarball is copied into that directory's `tools/`, where the consumer declares
 * `"@beyond-js/ui": "file:tools/beyond-ui-<version>.tgz"` and runs `npm install`:
 *
 *     npm run pack:consumers -- <consumer directory> [<consumer directory> …]
 */
class Pack {
	#root = fileURLToPath(new URL('..', import.meta.url));

	run(consumers) {
		const { version } = JSON.parse(readFileSync(join(this.#root, 'package.json'), 'utf8'));
		const directory = join(this.#root, 'dist-pack');
		mkdirSync(directory, { recursive: true });
		const produced = execFileSync('npm', ['pack', '--pack-destination', directory, '--loglevel=error'], { cwd: this.#root, encoding: 'utf8' }).trim().split('\n').at(-1);
		const name = `beyond-ui-${version}.tgz`;
		const tarball = join(directory, name);
		renameSync(join(directory, produced), tarball);
		const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
		writeFileSync(`${tarball}.integrity`, `${integrity}\n`);
		console.log(`dist-pack/${name}\n${integrity}`);
		for (const consumer of consumers) {
			const target = join(resolve(consumer), 'tools');
			if (!existsSync(resolve(consumer, 'package.json'))) throw new Error(`${consumer} has no package.json`);
			mkdirSync(target, { recursive: true });
			copyFileSync(tarball, join(target, name));
			console.log(`copied to ${join(consumer, 'tools', name)}; declare "@beyond-js/ui": "file:tools/${name}" and run npm install there`);
		}
	}
}

new Pack().run(process.argv.slice(2));
