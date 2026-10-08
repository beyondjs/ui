// 0.11.2 in plain DOM: the composer's one toolbar row, a summary, a drop surface and a refused file; Bytes,
// CopyButton, a long Facts row, Hint's tips.
import { Bytes, Composer, CopyButton, Facts, Hint } from '@beyond-js/ui';
import type { ComposerAttachment, ComposerLevel, ComposerToolbar } from '@beyond-js/ui';

const surface = document.createElement('main');
const refused: ComposerAttachment = { key: 'b', name: 'clip.mp4', state: 'refused', reason: 'only images' };
const composer = new Composer({ label: 'Message', summary: 'Opus 5.5', attach: { onfiles: () => undefined, zone: surface }, attachments: [refused], onsubmit: async () => undefined });
const toolbar: ComposerToolbar = composer.toolbar;
const level: ComposerLevel = toolbar.level;
toolbar.measure();
composer.summary = null;
composer.zone = null;
const available: boolean = composer.fold.available;
// @ts-expect-error a state the composer does not know
void ({ key: 'c', name: 'x', state: 'rejected' } satisfies ComposerAttachment);

const size: string | null = new Bytes({ locale: 'es' }).of(1200);
const copy = new CopyButton({ text: () => 'src/a.js', label: 'Copy path', name: 'Copy the path src/a.js', select: () => null, onresult: copied => void copied });
const result: 'copied' | 'refused' | null = copy.result;
void copy.copy();
const long: boolean = Facts.long({ value: 'A sentence', mono: false, long: null });
void new Facts({ rows: [{ label: 'Sandbox', value: 'Not checked on lab yet', long: true }] });
void new Hint(document.body, { when: target => target.isConnected });

export { level, available, size, result, long };
