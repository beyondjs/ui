import { readFileSync, statSync } from 'node:fs';

/**
 * Notices, under a running development server, that another copy of this package was installed
 * (0.25.0). A server started earlier keeps serving the copy it loaded: its module cache and its
 * prepared dependencies hold the earlier version, and a document that mixes both breaks. The call comes
 * once the install has settled, never in the middle of one, so a server restarts once, on what is
 * installed.
 *
 * Every `interval` it compares the package's manifest with the one seen when it was made; polling
 * survives an install replacing the package's directory. Once the manifest differs, the install has
 * settled when npm has written its record of `node_modules` (`.package-lock.json`, written last) after
 * the manifest, or after `bound` without one, and both have then been still for `settle`. An install of
 * another package changes the record alone, and nothing is called.
 */
export class OpeningInstall {
	static interval = 1000;
	static settle = 1500;
	static bound = 60000;

	#manifest;
	#record;
	#seen;
	#timer = 0;

	/**
	 * @param {URL} root the installed package's directory (`node_modules/@beyond-js/ui/`)
	 */
	constructor(root) {
		this.#manifest = new URL('package.json', root);
		this.#record = new URL('../../.package-lock.json', root);
		this.#seen = OpeningInstall.#stamp(this.#manifest);
	}

	/** The installed version, or an empty string when the manifest cannot be read */
	get version() {
		try {
			return JSON.parse(readFileSync(this.#manifest, 'utf8')).version ?? '';
		} catch {
			return '';
		}
	}

	/** Calls `changed(version)` each time another copy has been installed and the install has settled */
	watch(changed) {
		this.stop();
		let moving = '';
		let since = 0;
		let first = 0;
		this.#timer = setInterval(() => {
			const manifest = OpeningInstall.#stamp(this.#manifest);
			if (!manifest || manifest === this.#seen) return void (moving = '');
			const now = Date.now();
			first ||= now;
			const both = `${manifest}|${OpeningInstall.#stamp(this.#record)}`;
			if (both !== moving) return void ((moving = both), (since = now));
			// npm writes its record last: until it follows the manifest the install is still running
			if (OpeningInstall.#time(this.#record) < OpeningInstall.#time(this.#manifest) && now - first < OpeningInstall.bound) return;
			if (now - since < OpeningInstall.settle) return;
			this.#seen = manifest;
			moving = '';
			first = 0;
			changed(this.version);
		}, OpeningInstall.interval);
		// A server that closes is never kept alive by this
		this.#timer.unref?.();
	}

	stop() {
		clearInterval(this.#timer);
	}

	/** A file as written: a reinstall of the same version is another copy too */
	static #stamp(file) {
		try {
			const { mtimeMs, size } = statSync(file);
			return `${mtimeMs}:${size}`;
		} catch {
			return '';
		}
	}

	static #time(file) {
		try {
			return statSync(file).mtimeMs;
		} catch {
			return 0;
		}
	}
}
