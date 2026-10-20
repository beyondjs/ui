import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Page } from './support/page.mjs';

const page = new Page();
const ui = await import('@beyond-js/ui/dom');
after(() => page.close());

test('all public component catalogs preserve matching English and Spanish keys and value shapes', () => {
	const sets = Object.entries(ui).filter(([, component]) => component?.labels?.en && typeof component.labels.en === 'object');
	assert.ok(sets.length > 50, 'the complete public catalog is visited, including newer components');
	for (const [name, component] of sets) {
		const { en, es } = component.labels;
		assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort(), name);
		for (const key of Object.keys(en)) assert.equal(typeof es[key], typeof en[key], `${name}.${key}`);
	}
});

test('notification outages describe their own scope and preserve each source cause', () => {
	for (const language of ['en', 'es']) {
		const words = ui.NotificationEntry.labels[language];
		assert.doesNotMatch(words.unavailable + words.cause, /Everything else works|Todo lo demás funciona/);
		for (const cause of ['not_configured', 'not_platform_session', 'session_rejected', 'projects_unavailable', 'accounts_unavailable']) assert.ok(words[cause].length, cause);
		assert.ok(words.cause.includes('{reason}'), 'the source cause remains visible');
	}
});

test('approval delivery failure remains unconfirmed rather than claiming that nothing arrived', () => {
	assert.match(ui.CommandCard.labels.en.failed, /could not be confirmed/);
	assert.match(ui.CommandCard.labels.es.failed, /confirmar/);
	assert.doesNotMatch(ui.CommandCard.labels.en.failed, /did not reach|not received/);
});

test('shorter session and secret guidance keeps automatic retry, retained work and manual credential replacement', () => {
	assert.match(ui.Session.labels.en.unavailable_body, /retries automatically.*work stays here/);
	assert.match(ui.Session.labels.es.unavailable_body, /reintenta automáticamente.*trabajo sigue aquí/);
	assert.match(ui.SecretField.labels.en.last, /only when connecting.*until someone replaces it/);
	assert.match(ui.SecretField.labels.es.last, /solo si no puedes conectar.*hasta que alguien lo reemplace/);
});
