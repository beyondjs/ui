import { CopyButton } from '../copy-button.js';

/**
 * The copy of `Diff` in English and Spanish (`Diff.labels`). Counts are functions of `{ count, number }`
 * (`number` is the count formatted for the diff's locale), so each language writes its own plurals; a
 * product may replace an entry with a string that uses `{number}`. Each set carries `CopyButton`'s result words
 * for "Copy path" (`done`, `refused`, `said`, `why`, `selected`).
 */
const plural = (one, other) => ({ count, number }) => (count === 1 ? one : other.replace('{number}', number));
/** CopyButton's result words under keys of their own, so a status word never replaces them. */
const words = ({ copied, refused, said, why, selected }) => ({ done: copied, refused, said, why, selected });
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const labels = freeze({
	en: {
		...words(CopyButton.labels.en),
		label: 'Changes',
		files: plural('1 file changed', '{number} files changed'),
		plus: plural('1 added line', '{number} added lines'),
		minus: plural('1 removed line', '{number} removed lines'),
		counts: '{plus}, {minus}',
		open: 'Open all',
		fold: 'Fold all',
		jump: 'Files in this change',
		keys: 'Arrow keys move between files; ] and [ move between hunks.',
		lines: 'Lines of {path}',
		path: 'Copy path',
		name: 'Copy the path {path}',
		to: 'to',
		added: 'Added',
		modified: 'Modified',
		deleted: 'Deleted',
		renamed: 'Renamed',
		copied: 'Copied',
		mode: 'Mode changed',
		addition: 'Added line {number}: ',
		deletion: 'Removed line {number}: ',
		context: 'Line {number}: ',
		newline: 'No newline at end of file',
		gap: plural('1 unchanged line not in this patch', '{number} unchanged lines not in this patch'),
		more: plural('Show 1 unchanged line', 'Show {number} unchanged lines'),
		large: plural('Large diff · 1 line', 'Large diff · {number} lines'),
		show: 'Show',
		binary: 'Binary file · not shown',
		bytes: 'Binary',
		same: 'Renamed without changes',
		duplicate: 'Copied without changes',
		changed: 'File mode changed from {old} to {new}',
		empty: 'Empty file',
		nothing: 'No lines shown for this file',
		whitespace: 'Whitespace changes only',
		unread: 'This part of the patch couldn’t be read',
		none: 'No changes'
	},
	es: {
		...words(CopyButton.labels.es),
		label: 'Cambios',
		files: plural('1 archivo cambiado', '{number} archivos cambiados'),
		plus: plural('1 línea añadida', '{number} líneas añadidas'),
		minus: plural('1 línea eliminada', '{number} líneas eliminadas'),
		counts: '{plus}, {minus}',
		open: 'Abrir todos',
		fold: 'Plegar todos',
		jump: 'Archivos de este cambio',
		keys: 'Las flechas mueven entre archivos; ] y [ mueven entre bloques de cambios.',
		lines: 'Líneas de {path}',
		path: 'Copiar ruta',
		name: 'Copiar la ruta {path}',
		to: 'a',
		added: 'Añadido',
		modified: 'Modificado',
		deleted: 'Eliminado',
		renamed: 'Renombrado',
		copied: 'Copiado',
		mode: 'Modo cambiado',
		addition: 'Línea añadida {number}: ',
		deletion: 'Línea eliminada {number}: ',
		context: 'Línea {number}: ',
		newline: 'Sin salto de línea al final del archivo',
		gap: plural('1 línea sin cambios fuera de este parche', '{number} líneas sin cambios fuera de este parche'),
		more: plural('Mostrar 1 línea sin cambios', 'Mostrar {number} líneas sin cambios'),
		large: plural('Diff extenso · 1 línea', 'Diff extenso · {number} líneas'),
		show: 'Mostrar',
		binary: 'Archivo binario · no se muestra',
		bytes: 'Binario',
		same: 'Renombrado sin cambios',
		duplicate: 'Copiado sin cambios',
		changed: 'Modo del archivo cambiado de {old} a {new}',
		empty: 'Archivo vacío',
		nothing: 'Este archivo no muestra líneas',
		whitespace: 'Solo cambios de espacios en blanco',
		unread: 'Esta parte del parche no se pudo leer',
		none: 'Sin cambios'
	}
});
