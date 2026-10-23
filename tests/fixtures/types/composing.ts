// Types of the composer's one geometry (0.26.0, D165): the + entries, the live state, a primary that says
// its words, a bare Button and a bare CopyButton.
import { Button, Composer, CopyButton, type ComposerEntry } from '@beyond-js/ui';

const entries: ComposerEntry[] = [{ label: 'Mention a file', keys: '@', run: () => undefined }, { label: 'Commands', run: () => undefined }];
const composer = new Composer({ label: 'Message', onsubmit: async () => undefined, add: entries, live: false, actions: [{ id: 'send', label: 'Check whether it started', words: true }] });
composer.add = [];
composer.live = true;
const plus = new Button({ label: 'Attach files', glyph: 'plus', variant: 'quiet', bare: true });
plus.bare = false;
plus.glyph = 'check';
plus.name = 'Attach a file';
const copy = new CopyButton({ text: () => 'answer', label: 'Copy', bare: true, glyph: 'copy' });
void copy.copy();
// @ts-expect-error an entry runs something
void new Composer({ label: 'x', onsubmit: async () => undefined, add: [{ label: 'Nothing' }] });
