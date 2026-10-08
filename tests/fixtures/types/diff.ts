// 0.11.2: a typed plain DOM consumer of Diff: a patch or files, its options, its data and its methods.
import { Diff } from '@beyond-js/ui';
import type { DiffData, DiffFile, DiffLine } from '@beyond-js/ui';

const lines: DiffLine[] = [' a', '-b', '+B', { kind: 'note', text: 'No newline at end of file' }];
const files: DiffFile[] = [{ path: 'src/a.js', hunks: [{ old: 1, new: 1, header: 'function a()', lines }] }, { path: 'src/b.js', previous: 'src/old.js', status: 'renamed' }, { path: 'bin/run.sh', mode: { old: '100644', new: '100755' } }];
const diff = new Diff({ files, label: 'Changes', level: 3, open: 'auto', summary: true, labels: Diff.labels.es, locale: 'es' });
diff.patch = 'diff --git a/x b/x\n';
diff.files = files;
diff.files = null;
const data: DiffData[] = diff.files;
const parsed: DiffData[] = Diff.parse('--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n');
const added: number = parsed[0].added + data.length;
void [added, diff.open('src/a.js'), diff.close('src/a.js'), diff.reveal('src/a.js'), diff.element.tagName];
Diff.budget = { lines: 2000, file: 400 };
Diff.jump = 5;
diff.destroy();
// @ts-expect-error a status is one of the five
void new Diff({ files: [{ path: 'x', status: 'moved' }] });
// @ts-expect-error a file is named by its path
void new Diff({ files: [{ hunks: [] }] });
// @ts-expect-error open is auto, all or none
void new Diff({ open: 'some' });
