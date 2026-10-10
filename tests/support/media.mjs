/**
 * The browser's media for a happy-dom page, faked for dictation tests: `navigator.mediaDevices` with a
 * `getUserMedia` that grants, refuses by an error's name, or waits for the test (`hold`), streams of
 * tracks that record whether they were stopped and can end by themselves, a `MediaRecorder` whose
 * `isTypeSupported` answers from a list and that gives one chunk of data on stop, an `AudioContext`
 * with an analyser, and animation frames the test can count. `install()` puts them on the window and
 * `uninstall()` takes every one away again.
 */
export class Media {
	#window;
	#types;
	#refuse;
	#hold;
	#saved = [];
	#waiting = [];
	calls = 0;
	streams = [];
	recorders = [];
	contexts = [];
	frames = new Map();

	/**
	 * @param {Window} window the happy-dom window
	 * @param {{types?: string[], refuse?: string|null, hold?: boolean, devices?: boolean, recorder?: boolean, audio?: boolean}} [options]
	 *   the supported types, an error name getUserMedia rejects with, whether it waits for `grant()`, and
	 *   which of the devices, the recorder and the audio context exist
	 */
	constructor(window, { types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'], refuse = null, hold = false, devices = true, recorder = true, audio = true } = {}) {
		this.#window = window;
		this.#types = types;
		this.#refuse = refuse;
		this.#hold = hold;
		this.devices = devices;
		this.recorder = recorder;
		this.audio = audio;
	}

	/** Every track of every stream given, and whether it was stopped. */
	get tracks() {
		return this.streams.flatMap(stream => stream.getTracks());
	}

	install() {
		const window = this.#window;
		const media = this;
		const Track = class extends window.EventTarget {
			readyState = 'live';
			stop() {
				this.readyState = 'ended';
			}
			/** The device went away: the track ends by itself. */
			end() {
				this.readyState = 'ended';
				this.dispatchEvent(new window.Event('ended'));
			}
		};
		const Recorder = class extends window.EventTarget {
			state = 'inactive';
			constructor(stream, options = {}) {
				super();
				this.stream = stream;
				this.options = options;
				this.mimeType = options.mimeType ?? '';
				media.recorders.push(this);
			}
			static isTypeSupported(type) {
				return media.#types.includes(type);
			}
			start(slice) {
				this.slice = slice;
				this.state = 'recording';
			}
			stop() {
				if (this.state === 'inactive') return;
				this.state = 'inactive';
				queueMicrotask(() => {
					const data = new window.Event('dataavailable');
					data.data = new window.Blob(['voice'], { type: this.mimeType });
					this.dispatchEvent(data);
					this.dispatchEvent(new window.Event('stop'));
				});
			}
		};
		const Context = class {
			state = 'running';
			constructor() {
				media.contexts.push(this);
			}
			createAnalyser() {
				return { fftSize: 2048, getByteTimeDomainData: samples => samples.fill(200) };
			}
			createMediaStreamSource() {
				return { connect() {} };
			}
			close() {
				this.state = 'closed';
				return Promise.resolve();
			}
		};
		let frame = 0;
		const getUserMedia = constraints => {
			this.calls += 1;
			this.constraints = constraints;
			if (this.#refuse) return Promise.reject(Object.assign(new Error(this.#refuse), { name: this.#refuse }));
			const stream = { tracks: [new Track()], getTracks() {
				return this.tracks;
			} };
			if (!this.#hold) return (this.streams.push(stream), Promise.resolve(stream));
			return new Promise(resolve => this.#waiting.push(() => (this.streams.push(stream), resolve(stream))));
		};
		this.#set(window.navigator, 'mediaDevices', this.devices ? { getUserMedia } : undefined);
		this.#set(window, 'MediaRecorder', this.recorder ? Recorder : undefined);
		this.#set(window, 'AudioContext', this.audio ? Context : undefined);
		this.#set(window, 'requestAnimationFrame', callback => (this.frames.set(++frame, callback), frame));
		this.#set(window, 'cancelAnimationFrame', id => this.frames.delete(id));
		return this;
	}

	/** Grants the microphone a held `getUserMedia` waits for. */
	grant() {
		for (const resolve of this.#waiting.splice(0)) resolve();
	}

	/** Runs the frames asked for, at a moment in milliseconds. */
	draw(time) {
		const frames = [...this.frames.values()];
		this.frames.clear();
		for (const callback of frames) callback(time);
	}

	uninstall() {
		for (const [target, name, descriptor] of this.#saved.reverse()) {
			if (descriptor) Object.defineProperty(target, name, descriptor);
			else delete target[name];
		}
		this.#saved = [];
	}

	#set(target, name, value) {
		this.#saved.push([target, name, Object.getOwnPropertyDescriptor(target, name)]);
		Object.defineProperty(target, name, { value, configurable: true, writable: true });
	}
}
