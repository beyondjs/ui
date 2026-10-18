import { test } from 'node:test';
import assert from 'node:assert/strict';

const ui = await import('@beyond-js/ui/dom');

/**
 * 0.17.2 (D141): the family bar's copy says the family's words. What Beyond Snapshots keeps is a snapshot
 * ("instantánea"), "capture" stays only in identifiers; a computer Conduict operates is a machine; the Desktop is
 * Beyond Home. Every product the switcher names has an area line, aligned with Projects' product leads.
 */
const retired = [
	['capture (say snapshot)', /captur/i],
	['environment for a machine (say machine)', /environments and|entornos y/i],
	['the Desktop (say Beyond Home)', /\bDesktop\b|\bEscritorio\b/]
];

/** Every string of a copy set, the area and role lines included, as `key: text` */
function texts(labels) {
	const products = Object.keys(ui.productNames);
	return Object.entries(labels).flatMap(([key, value]) => {
		if (key === 'area') return products.map(product => [`area.${product}`, value({ product })]);
		if (key === 'role') return ['owner', 'admin', 'developer', 'viewer', 'member'].map(role => [`role.${role}`, value({ role })]);
		return typeof value === 'string' ? [[key, value]] : [];
	});
}

const said = labels =>
	texts(labels).flatMap(([key, text]) => retired.filter(([, word]) => word.test(text.replace(/\{\w+\}/g, ''))).map(([name]) => `${key}: ${name}`));

for (const language of ['en', 'es']) {
	test(`FamilyBar's ${language} copy says no retired word (D141)`, () => {
		assert.deepEqual(said(ui.FamilyBar.labels[language]), []);
	});

	test(`every product the switcher names has an area line in ${language}`, () => {
		// Docs is the bar's link to the documentation, not a product with an area
		const missing = Object.keys(ui.productNames).filter(product => product !== 'docs' && !ui.FamilyBar.labels[language].area({ product }));
		assert.deepEqual(missing, []);
	});
}

test('the area lines say snapshot and machine, in the switcher’s short form of Projects’ leads', () => {
	const { en, es } = ui.FamilyBar.labels;
	const lines = labels => ['snapshots', 'conduict', 'packages', 'home'].map(product => labels.area({ product }));
	assert.deepEqual(lines(en), ['Snapshots of selected packages', 'Machines and their conversations', 'Packages, previews and snapshots', 'Your projects, recent work and what needs you']);
	assert.deepEqual(lines(es), ['Instantáneas de los paquetes elegidos', 'Máquinas y sus conversaciones', 'Paquetes, vistas previas e instantáneas', 'Tus proyectos, el trabajo reciente y lo que te necesita']);
});

test('would be caught: a retired word in a copy set fails, a placeholder does not', () => {
	const sample = { title: 'From {capture}', a: 'Captures', area: ({ product }) => ({ conduict: 'Environments and conversations', home: 'Open the Desktop' })[product] ?? 'Fine' };
	assert.deepEqual(said(sample), ['a: capture (say snapshot)', 'area.conduict: environment for a machine (say machine)', 'area.home: the Desktop (say Beyond Home)']);
});
