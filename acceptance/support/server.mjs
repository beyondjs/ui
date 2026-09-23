import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json' };

/**
 * A static file server over one directory on an ephemeral port, for the consumer pages. It serves
 * files only below its root and closes with the run.
 */
export class Server {
	#root;
	#server = null;
	#port = 0;

	constructor(root) {
		this.#root = root;
	}

	get origin() {
		return `http://127.0.0.1:${this.#port}`;
	}

	async start() {
		this.#server = createServer((request, response) => {
			const path = normalize(decodeURIComponent(new URL(request.url, 'http://local').pathname)).replace(/^([/\\])+/, '');
			const file = join(this.#root, path);
			if (!file.startsWith(this.#root)) return response.writeHead(403).end();
			try {
				if (!statSync(file).isFile()) throw new Error('not a file');
			} catch {
				return response.writeHead(404).end();
			}
			response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
			createReadStream(file).pipe(response);
		});
		await new Promise(resolve => this.#server.listen(0, '127.0.0.1', resolve));
		this.#port = this.#server.address().port;
		return this;
	}

	async stop() {
		if (!this.#server) return;
		this.#server.closeAllConnections?.();
		await new Promise(resolve => this.#server.close(resolve));
		this.#server = null;
	}
}
