// The fictional crew of the lanes pages (0.22.0): six subagents of one turn, started at 10:42:05 local time
// on 23 October 2026 and read 102 s later, one nested, with the product's words in English and Spanish.
export const start = new Date(2026, 9, 23, 10, 42, 5).getTime();

const words = {
	en: { working: 'Working', finished: 'Finished', waiting: 'Waiting for you', failed: 'Failed', tokens: 'tokens', titles: ['Explore the auth module', 'Map the payments API', 'Review the migration plan', 'Check index usage', 'Fix the flaky test', 'Benchmark the cache', 'Summarize the findings'], now: ['Reading src/auth/session.ts', 'Finished · 31 steps', 'Searching "lease"', 'Running psql -c "explain analyze select * from leases where owner = $1"', 'Waiting for you · run npm test', 'Failed · exit 1', 'Thinking'] },
	es: { working: 'Trabajando', finished: 'Terminó', waiting: 'Te espera', failed: 'Falló', tokens: 'tokens', titles: ['Explorar el módulo de autenticación', 'Mapear la API de pagos', 'Revisar el plan de migración', 'Comprobar el uso de índices', 'Arreglar la prueba inestable', 'Medir la caché', 'Resumir lo encontrado'], now: ['Leyendo src/auth/session.ts', 'Terminó · 31 pasos', 'Buscando "lease"', 'Ejecutando psql -c "explain analyze select * from leases where owner = $1"', 'Te espera · ejecutar npm test', 'Falló · salida 1', 'Pensando'] }
};

/** The crew in a language, as a product gives it to `Lanes.update({ lanes })`. */
export function crew(language = 'en') {
	const say = words[language];
	const lane = (index, values) => ({ title: say.titles[index], now: say.now[index], ...values });
	return [
		lane(0, { key: 'explore', state: 'running', stateLabel: say.working, kind: 'Explore', facts: [{ text: '48k', label: say.tokens }], since: start }),
		lane(1, { key: 'map', state: 'done', stateLabel: say.finished, kind: 'Explore', facts: [{ text: '61k', label: say.tokens }], since: start, until: start + 95_000 }),
		lane(2, { key: 'plan', state: 'running', stateLabel: say.working, kind: 'Plan', facts: [{ text: '22k', label: say.tokens }], since: start + 44_000 }),
		lane(3, { key: 'index', depth: 1, state: 'running', stateLabel: say.working, kind: 'general-purpose', facts: [{ text: '8k', label: say.tokens }], since: start + 82_000 }),
		lane(4, { key: 'fix', state: 'waiting', stateLabel: say.waiting, facts: [{ text: '11k', label: say.tokens }], since: start + 69_000 }),
		lane(5, { key: 'bench', state: 'failed', stateLabel: say.failed, facts: [{ text: '15k', label: say.tokens }], since: start + 10_000, until: start + 51_000 })
	];
}

/** A lane that starts later, appended by `window.fixture.add()`. */
export function late(language = 'en') {
	const say = words[language];
	return { key: 'summary', state: 'running', stateLabel: say.working, title: say.titles[6], now: say.now[6], kind: 'general-purpose', facts: [{ text: '2k', label: say.tokens }], since: start + 100_000 };
}

/** Every state once, for the marks. */
export const states = ['running', 'waiting', 'done', 'failed', 'stopped', 'unknown'].map((state, index) => ({ key: state, state, title: state, since: start + index * 1000, until: ['done', 'failed', 'stopped'].includes(state) ? start + 60_000 : null }));
