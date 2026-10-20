import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';
import { Dictations } from './support/dictation.mjs';

/** A composer's dictation (0.14.0), its failures: each kind in words with its ways on, the recording kept where it can be transcribed again, the product's own words or silence, the bound, and a cancelled transcription's late answer ignored. */
const page = new Page();
const { ComposerDictation } = await import('../src/dom/composer/dictation/dictation.js');
const { Clock } = await import('../src/dom/time/clock.js');
const dictations = new Dictations(page, { ComposerDictation, Clock });
const make = options => dictations.make(options);
const { settle, actions, press, words, said, record } = Dictations;
after(() => page.close());
beforeEach(() => page.reset());
afterEach(() => dictations.release());

test('a microphone the browser will not give: denied, missing or busy, each with Try again and Dismiss', async () => {
	const cases = [
		['NotAllowedError', 'denied', 'Microphone access is blocked. Allow this site in your browser settings, then try again.'],
		['SecurityError', 'denied', null],
		['NotFoundError', 'missing', 'No microphone was found.'],
		['OverconstrainedError', 'missing', null],
		['NotReadableError', 'busy', 'The microphone is in use by another app.'],
		['AbortError', 'busy', null]
	];
	for (const [name, kind, sentence] of cases) {
		const { dictation, media } = make({ media: { refuse: name } });
		await dictation.start();
		assert.equal(dictation.state, 'failed');
		assert.equal(dictation.failure, kind, name);
		if (sentence) assert.equal(words(dictation), sentence);
		assert.equal(said(dictation), words(dictation), 'said once');
		assert.deepEqual(actions(dictation), ['Try again', 'Dismiss']);
		press(dictation, 'Try again');
		await settle();
		assert.equal(media.calls, 2, 'Try again asks again');
		press(dictation, 'Dismiss');
		assert.equal(dictation.state, 'idle');
	}
});

test('a recording interrupted by the device or a hidden page keeps what was recorded', async () => {
	for (const how of ['ended', 'hidden']) {
		const harness = make();
		const { dictation, media, calls, answers } = harness;
		await dictation.start();
		harness.advance(4000);
		if (how === 'ended') media.tracks[0].end();
		else {
			Object.defineProperty(page.document, 'visibilityState', { value: 'hidden', configurable: true });
			page.document.dispatchEvent(new page.window.Event('visibilitychange'));
		}
		await settle();
		assert.equal(dictation.state, 'failed');
		assert.equal(dictation.failure, 'interrupted');
		assert.equal(words(dictation), how === 'ended' ? 'Recording stopped: the microphone was disconnected.' : 'Recording stopped: the page was hidden.');
		assert.deepEqual(actions(dictation), ['Transcribe what was recorded', 'Discard']);
		assert.equal(calls.length, 0);
		assert.ok(media.tracks.every(track => track.readyState === 'ended'));
		press(dictation, 'Transcribe what was recorded');
		await settle();
		assert.equal(dictation.state, 'transcribing');
		assert.equal(calls[0].seconds, 4);
		answers[0].resolve({ text: 'kept words' });
		await settle();
		assert.equal(harness.field.value, 'kept words');
		delete page.document.visibilityState;
	}
});

test('under a second is too short: kept, not transcribed, with Try again and Discard', async () => {
	const harness = make();
	await record(harness, 600);
	assert.equal(harness.dictation.failure, 'short');
	assert.equal(words(harness.dictation), 'Too short to transcribe.');
	assert.deepEqual(actions(harness.dictation), ['Try again', 'Discard']);
	assert.equal(harness.calls.length, 0);
	press(harness.dictation, 'Try again');
	await settle();
	assert.equal(harness.dictation.state, 'recording', 'Try again records again');
	assert.equal(harness.media.calls, 2);
});

test('no speech recognized: said, with Try again to record again and Dismiss', async () => {
	const harness = make({ value: 'as it was' });
	await record(harness);
	harness.answers[0].resolve({ text: '   ' });
	await settle();
	assert.equal(harness.dictation.failure, 'none');
	assert.equal(words(harness.dictation), 'No speech was recognized.');
	assert.deepEqual(actions(harness.dictation), ['Try again', 'Dismiss']);
	assert.equal(harness.field.value, 'as it was');
	assert.equal(harness.inserted.length, 0);
});

test('unavailable keeps the recording: Try again transcribes the same one again, without asking the microphone', async () => {
	const harness = make();
	await record(harness);
	harness.answers[0].reject(new Error('502'));
	await settle();
	assert.equal(harness.dictation.failure, 'unavailable');
	assert.equal(words(harness.dictation), 'Dictation isn’t available now. Your recording is kept.');
	assert.deepEqual(actions(harness.dictation), ['Try again', 'Discard']);
	press(harness.dictation, 'Try again');
	await settle();
	assert.equal(harness.calls.length, 2);
	assert.ok(harness.calls[1].blob === harness.calls[0].blob, 'the same recording');
	assert.equal(harness.media.calls, 1, 'no new microphone');
	harness.answers[1].resolve({ text: 'second time' });
	await settle();
	assert.equal(harness.field.value, 'second time');
});

test('past its bound the transcription is aborted and fails as unavailable; its late answer is ignored', async () => {
	const harness = make({ options: { bound: 10_000 } });
	await record(harness);
	harness.advance(9000);
	assert.equal(harness.dictation.state, 'transcribing');
	harness.advance(1000);
	assert.equal(harness.calls[0].signal.aborted, true);
	assert.equal(harness.dictation.failure, 'unavailable');
	harness.answers[0].resolve({ text: 'too late' });
	await settle();
	assert.equal(harness.field.value, '');
	assert.equal(harness.dictation.state, 'failed');
});

test('the product explains a refusal: its words with Discard, or with Try again, or silence', async () => {
	const limited = make({ options: { explain: () => 'You reached today’s dictation limit.' } });
	await record(limited);
	limited.answers[0].reject(new Error('429'));
	await settle();
	assert.equal(limited.dictation.failure, 'limit');
	assert.equal(words(limited.dictation), 'You reached today’s dictation limit.');
	assert.deepEqual(actions(limited.dictation), ['Discard']);
	const retried = make({ options: { explain: () => ({ text: 'Busy, try in a moment.', retry: true }) } });
	await record(retried);
	retried.answers[0].reject(new Error('503'));
	await settle();
	assert.equal(retried.dictation.failure, 'limit');
	assert.deepEqual(actions(retried.dictation), ['Try again', 'Discard']);
	const silent = make({ options: { explain: () => null } });
	await record(silent);
	const before = said(silent.dictation);
	silent.answers[0].reject(new Error('401'));
	await settle();
	assert.equal(silent.dictation.failure, 'silent');
	assert.equal(silent.dictation.element.querySelector('.bui-dictation-text').hidden, true, 'no words of its own');
	assert.equal(said(silent.dictation), before, 'nothing announced');
	assert.deepEqual(actions(silent.dictation), ['Try again', 'Discard']);
	const nothing = make({ options: { explain: () => undefined } });
	await record(nothing);
	nothing.answers[0].reject(new Error('500'));
	await settle();
	assert.equal(nothing.dictation.failure, 'unavailable');
});

test('Cancel while transcribing aborts the signal, discards, and a late answer is ignored', async () => {
	const harness = make({ value: 'draft' });
	await record(harness);
	harness.field.focus();
	press(harness.dictation, 'Cancel');
	assert.equal(harness.calls[0].signal.aborted, true);
	assert.equal(harness.dictation.state, 'idle');
	harness.answers[0].resolve({ text: 'late' });
	await settle();
	assert.equal(harness.field.value, 'draft');
	assert.equal(harness.inserted.length, 0);
});
