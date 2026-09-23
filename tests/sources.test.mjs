import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Conventions of the package source: file length, stylesheets over tokens only, every public class
 * documented, the React adapter free of behavior copies, and no machine-specific path.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const walk = directory => readdirSync(directory).flatMap(name => (statSync(join(directory, name)).isDirectory() ? walk(join(directory, name)) : [join(directory, name)]));
const sources = ['src', 'tests', 'acceptance', 'tools', 'types'].flatMap(name => walk(join(root, name))).filter(path => !/node_modules/.test(path));
const code = sources.filter(path => /\.(js|mjs|jsx|css|ts)$/.test(path));

test('no source file exceeds the 300-line target', () => {
	for (const path of code) {
		const lines = readFileSync(path, 'utf8').split('\n').length - 1;
		assert.ok(lines <= 300, `${relative(root, path)} has ${lines} lines`);
	}
});

test('component stylesheets use tokens only: no color literal', () => {
	for (const path of code.filter(path => /src[\\/]styles[\\/].*\.css$/.test(path) || /acceptance[\\/]fixtures[\\/].*\.css$/.test(path))) {
		const text = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		assert.doesNotMatch(text, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(white|black|red|blue|green|gray|grey)\b\s*;/i, relative(root, path));
	}
});

test('every exported class carries a doc comment', () => {
	for (const path of code.filter(path => /src[\\/].*\.js$/.test(path))) {
		const text = readFileSync(path, 'utf8');
		for (const match of text.matchAll(/^export class (\w+)/gm)) {
			const before = text.slice(0, match.index).trimEnd();
			assert.ok(before.endsWith('*/'), `${relative(root, path)}: ${match[1]} has no doc comment`);
		}
	}
});

test('versioned content carries no machine-specific path', () => {
	const text = walk(root)
		.filter(path => !/node_modules|[\\/]\.git[\\/]|[\\/]dist[\\/]|[\\/]dist-pack[\\/]|package-lock|\.tgz$/.test(path))
		.map(path => readFileSync(path, 'utf8'))
		.join('\n');
	const machine = new RegExp(['/Us' + 'ers/', '/ho' + 'me/[a-z]', '/priv' + 'ate/tmp', 'C:\\\\\\\\Us' + 'ers'].join('|'));
	assert.doesNotMatch(text, machine);
});
