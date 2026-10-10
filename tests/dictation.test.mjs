import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Dictations } from './support/dictation.mjs';
import { Listeners } from './support/listeners.mjs';

/** A composer's dictation (0.14.0): offered only where it can record, asked only after a press, voice to editable text at the caret with its spaces, the cap, the meter, and nothing left running. */
const page = new Page();
const { ComposerDictation } = await import('../src/dom/composer/dictation/dictation.js');
const { Clock } = await import('../src/dom/time/clock.js');
const dictations = new Dictations(page, { ComposerDictation, Clock });
const make = options => dictations.make(options);
const { settle, actions, press, words, said, record } = Dictations;
after(() => page.close());
beforeEach(() => page.reset());
afterEach(() => dictations.release());

test('not offered without devices, a recorder or a supported type; Ogg alone is not enough', () => {
	const cases = [
		[{ devices: false }, 'unsupported'],
		[{ recorder: false }, 'unsupported'],
		[{ types: [] }, 'type'],
		[{ types: ['audio/ogg;codecs=opus', 'audio/ogg'] }, 'type']
	];
	for (const [media, reason] of cases) {
		const { dictation } = make({ media });
		assert.equal(dictation.available, false);
		assert.equal(dictation.reason, reason, JSON.stringify(media));
		assert.equal(dictation.button.hidden, true);
	}
	page.window.isSecureContext = false;
	const { dictation } = make({ media: { devices: false } });
	assert.equal(dictation.reason, 'insecure', 'a page that is not secure gets no devices');
	delete page.window.isSecureContext;
	assert.throws(() => make({ options: { transcribe: null } }), TypeError);
});

test('Dictate is a labelled button with the microphone beside its word, and nothing is asked before the press', async () => {
	const { dictation, media } = make();
	assert.equal(dictation.available, true);
	assert.equal(dictation.reason, null);
	assert.equal(dictation.button.hidden, false);
	assert.equal(dictation.button.textContent, 'Dictate');
	assert.ok(dictation.button.classList.contains('bui-dictation-button'));
	assert.ok(dictation.button.classList.contains('bui-button-quiet'));
	assert.equal(dictation.button.querySelector('svg').getAttribute('data-icon'), 'microphone');
	assert.equal(dictation.state, 'idle');
	assert.equal(dictation.element.querySelector('.bui-dictation-row').hidden, true, 'the line is hidden while idle');
	await settle();
	assert.equal(media.calls, 0, 'no permission is asked at construction');
	dictation.button.click();
	await settle();
	assert.equal(media.calls, 1);
	assert.deepEqual(media.constraints, { audio: true });
});

test('the type is negotiated in order: WebM with Opus, WebM, MP4', async () => {
	for (const [types, chosen] of [
		[['audio/mp4', 'audio/webm', 'audio/webm;codecs=opus'], 'audio/webm;codecs=opus'],
		[['audio/mp4', 'audio/webm'], 'audio/webm'],
		[['audio/ogg;codecs=opus', 'audio/mp4'], 'audio/mp4']
	]) {
		const { dictation, media } = make({ media: { types } });
		await dictation.start();
		assert.equal(media.recorders[0].options.mimeType, chosen);
		dictation.cancel();
	}
});

test('press, record, stop: the text goes in at the caret with its spaces, editable and never sent', async () => {
	const harness = make({ value: 'Please fix the tests', at: 10 });
	const { dictation, media, field, root, calls, answers, inserted } = harness;
	dictation.button.focus();
	const starting = dictation.start();
	assert.equal(dictation.state, 'asking');
	assert.equal(words(dictation), 'Allow the microphone to dictate');
	assert.deepEqual(actions(dictation), ['Cancel']);
	assert.equal(document.activeElement.textContent, 'Cancel', 'focus follows the press into the line');
	assert.equal(dictation.button.getAttribute('aria-disabled'), 'true');
	assert.equal(dictation.button.getAttribute('aria-describedby'), dictation.element.querySelector('.bui-dictation-text').id);
	await starting;
	assert.equal(dictation.state, 'recording');
	assert.equal(dictation.element.dataset.state, 'recording');
	assert.equal(words(dictation), 'Recording');
	assert.equal(dictation.element.querySelector('.bui-dictation-time').textContent, '0:00 / 2:00');
	assert.deepEqual(actions(dictation), ['Stop', 'Cancel']);
	assert.equal(dictation.element.querySelector('.bui-dictation-level').getAttribute('aria-hidden'), 'true');
	assert.equal(said(dictation), 'Recording');
	assert.equal(media.recorders[0].state, 'recording');
	harness.advance(12_340);
	assert.equal(dictation.element.querySelector('.bui-dictation-time').textContent, '0:12 / 2:00');
	assert.equal(said(dictation), 'Recording', 'the ticking time is never said');
	const stopping = dictation.stop();
	await settle();
	assert.equal(dictation.state, 'transcribing');
	assert.equal(words(dictation), 'Transcribing…');
	assert.ok(dictation.element.querySelector('.bui-dictation-mark .bui-spinner'));
	assert.deepEqual(actions(dictation), ['Cancel']);
	assert.ok(media.tracks.every(track => track.readyState === 'ended'), 'the microphone is closed');
	assert.equal(calls.length, 1);
	assert.equal(calls[0].type, 'audio/webm;codecs=opus');
	assert.equal(calls[0].seconds, 12.3);
	assert.equal(calls[0].blob.type, 'audio/webm;codecs=opus');
	assert.ok(calls[0].blob.size > 0);
	assert.equal(calls[0].signal.aborted, false);
	harness.advance(4000);
	assert.equal(dictation.element.querySelector('.bui-dictation-time').textContent, '0:04');
	answers[0].resolve({ text: '  and the build ' });
	await stopping;
	assert.equal(dictation.state, 'idle');
	assert.deepEqual(inserted, [{ text: 'Please fix and the build the tests', caret: 'Please fix and the build'.length }]);
	assert.equal(field.value, 'Please fix and the build the tests');
	assert.ok(root.contains(document.activeElement) && document.activeElement === field, 'focus is back in the field');
	assert.equal(said(dictation), 'Text added to your message');
	assert.equal(dictation.element.querySelector('.bui-dictation-row').hidden, true);
	assert.equal(dictation.button.getAttribute('aria-disabled'), null);
	assert.equal(calls[0].signal.aborted, false, 'an answered transcription is never aborted afterwards');
	assert.equal(harness.clock.size, 0, 'no time runs once it ends');
	assert.equal(media.frames.size, 0);
	assert.equal(media.contexts[0].state, 'closed');
	await record(harness, 2000);
	assert.equal(media.recorders.length, 2, 'a new recorder for each recording');
	assert.notEqual(media.recorders[1], media.recorders[0]);
	assert.equal(media.calls, 2);
});

test('the transcript replaces a selection and takes spaces only where needed', async () => {
	const cases = [
		['', 0, 'hello', 'hello'],
		['Fix it', 6, 'now', 'Fix it now'],
		['Fix it ', 7, 'now', 'Fix it now'],
		['world', 0, 'hello', 'hello world'],
		['a old b', [2, 5], 'new', 'a new b'],
		['ab', 1, 'x', 'a x b']
	];
	for (const [value, at, text, result] of cases) {
		const harness = make({ value, at });
		await record(harness);
		harness.answers[0].resolve({ text });
		await settle();
		assert.equal(harness.field.value, result, JSON.stringify([value, at, text]));
	}
});

test('Cancel while recording discards: nothing is transcribed, the microphone is closed', async () => {
	const { dictation, media, calls, field } = make({ value: 'kept' });
	await dictation.start();
	press(dictation, 'Cancel');
	await settle();
	assert.equal(dictation.state, 'idle');
	assert.equal(calls.length, 0);
	assert.ok(media.tracks.every(track => track.readyState === 'ended'));
	assert.equal(field.value, 'kept');
	assert.equal(media.frames.size, 0);
});

test('Escape in the composer cancels a recording, and is left alone otherwise', async () => {
	const { dictation, field, calls } = make();
	assert.equal(page.key(field, 'Escape').defaultPrevented, false, 'idle: Escape is not taken');
	await dictation.start();
	const event = page.key(field, 'Escape');
	assert.equal(event.defaultPrevented, true);
	assert.equal(dictation.state, 'idle');
	assert.equal(calls.length, 0);
	assert.equal(page.key(field, 'Escape').defaultPrevented, false);
});

test('ten seconds before the cap it says so once; at the cap it stops and transcribes by itself', async () => {
	const harness = make({ options: { cap: 30 } });
	const { dictation, calls } = harness;
	await dictation.start();
	assert.equal(dictation.element.querySelector('.bui-dictation-time').textContent, '0:00 / 0:30');
	harness.advance(19_000);
	assert.equal(dictation.element.querySelector('.bui-dictation-note').hidden, true);
	harness.advance(1000);
	assert.equal(dictation.element.querySelector('.bui-dictation-note').textContent, '10 seconds left');
	assert.equal(said(dictation), '10 seconds left');
	harness.advance(5000);
	assert.equal(said(dictation), '10 seconds left');
	harness.advance(5000);
	await settle();
	assert.equal(dictation.state, 'transcribing');
	assert.equal(calls.length, 1);
	assert.equal(calls[0].seconds, 30);
});

test('destroy releases the microphone, the audio context, frames, the clock, listeners and the transcription', async () => {
	const harness = make();
	const { dictation, media, clock, field } = harness;
	await dictation.start();
	assert.equal(media.contexts.length, 1);
	assert.equal(media.frames.size, 1, 'the meter asked for a frame');
	media.draw(100);
	assert.match(dictation.element.querySelector('.bui-dictation-level').style.getPropertyValue('--bui-dictation-level'), /^0\.\d+|^1\.00$/);
	assert.equal(clock.size, 1);
	dictation.destroy();
	assert.ok(media.tracks.every(track => track.readyState === 'ended'));
	assert.equal(media.contexts[0].state, 'closed');
	assert.equal(media.frames.size, 0);
	assert.equal(clock.size, 0);
	assert.equal(page.key(field, 'Escape').defaultPrevented, false, 'Escape is no longer taken');
	assert.equal(dictation.element.isConnected, false);
	const transcribing = make();
	await record(transcribing);
	transcribing.dictation.destroy();
	assert.equal(transcribing.calls[0].signal.aborted, true);
	assert.equal(transcribing.clock.size, 0);
});

test('the meter stays still without an audio context or under reduced motion; recording is unaffected', async () => {
	const plain = make({ media: { audio: false } });
	await plain.dictation.start();
	assert.equal(plain.dictation.state, 'recording');
	assert.equal(plain.media.frames.size, 0);
	plain.dictation.cancel();
	const saved = page.window.matchMedia;
	page.window.matchMedia = query => ({ matches: query.includes('reduced-motion'), media: query, addEventListener() {}, removeEventListener() {} });
	try {
		const still = make();
		await still.dictation.start();
		assert.equal(still.media.contexts.length, 0, 'no audio context is opened for a meter that stays still');
		assert.equal(still.media.frames.size, 0);
		assert.equal(still.dictation.state, 'recording');
	} finally {
		page.window.matchMedia = saved;
	}
});

test('the listeners of a recording live only while it does; Escape while transcribing is not taken', async () => {
	const listeners = new Listeners(page.window).install();
	try {
		const harness = make();
		assert.deepEqual(listeners.present().filter(entry => entry.includes('visibilitychange')), [], 'none while idle');
		await harness.dictation.start();
		assert.deepEqual(listeners.present().filter(entry => entry.includes('visibilitychange')), ['document:visibilitychange']);
		harness.advance(2000);
		harness.dictation.stop();
		await settle();
		assert.deepEqual(listeners.present().filter(entry => entry.includes('visibilitychange')), [], 'released once recording ends');
		assert.equal(page.key(harness.field, 'Escape').defaultPrevented, false);
		assert.equal(harness.dictation.state, 'transcribing');
		harness.dictation.destroy();
		assert.deepEqual(listeners.present().filter(entry => entry.includes('visibilitychange')), []);
	} finally {
		listeners.uninstall();
	}
});

test('a microphone granted after Cancel is closed at once and never recorded', async () => {
	const { dictation, media } = make({ media: { hold: true } });
	const starting = dictation.start();
	assert.equal(dictation.state, 'asking');
	dictation.cancel();
	media.grant();
	await starting;
	assert.equal(dictation.state, 'idle');
	assert.equal(media.recorders.length, 0);
	assert.ok(media.tracks.length === 1 && media.tracks[0].readyState === 'ended');
});

test('every copy has English and Spanish, with the same keys', () => {
	const { en, es } = ComposerDictation.labels;
	assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
	assert.ok(Object.isFrozen(en) && Object.isFrozen(es));
	const { dictation } = make({ labels: es });
	assert.equal(dictation.button.textContent, 'Dictar');
});
