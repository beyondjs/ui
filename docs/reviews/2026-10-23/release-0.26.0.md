# Local UI 0.26.0 verification: the composer's one geometry

Evidence baseline: UI `25b10e4` (0.25.1) on `feature/next` plus this change, made in a worktree on 2026-10-23 at the owner's request. Token set 0.6.0 is unchanged. Implementation is not the owner's acceptance.

## Why

The owner reviewed Conduict's conversation and its composer in screenshots and asked for the recommended redesign to be implemented at the highest standard. Three findings belong to this package:

- **Attach did not match the controls beside it.** It was a quiet text button among bordered chips, its edges did not show, it looked misaligned, and its hover fill was taller than theirs.
- **The state line floated.** It stood above the box, outside its edge.
- **Each control was drawn its own way.** Interrupt and Dictate were words beside glyphs, and Send grew with a repository's or a machine's name.

The product's part (one centred column, the message and its time, the turn's line) is Conduict's E450–E454.

## What changed

- **One toolbar row of one-target controls.** Every control of the composer's toolbar is one target tall (`--bui-target`, 44 px on touch screens) with one quiet edge. A glyph alone is a round target: the **+**, Dictate, Interrupt and Options. Its hover is a lift inside the same circle.
- **The +.** `ComposerAdd` attaches files at once (**Attach files**). With a product's entries (`add`, React `{ label, onSelect, keys? }`), it opens a menu named **Add** with Attach files first and each entry's key at its end ("Mention a file @", "Commands /"). It never folds.
- **Chips by their value.** A chip shows its value. Its label is its name and its tooltip at every level, and so are a ready state and, new, a `calm` option's state: a machine busy with other work is still said in its menu. A state that asks for attention keeps its word.
- **Glyphs named with the family tooltip.** `Button`'s `bare` (with `glyph` and `name`) and `CopyButton`'s `bare` and `glyph` draw a control as its glyph alone, named by its words, with the family tooltip (`Hint`). A copy's glyph turns into a check while it says "Copied". The closed list of D11 gains `plus`, `up`, `stop`, `microphone`, `copy`, `link`, `undo` and `check`.
- **Send.** Send is one round, filled target with the `up` glyph, named by its action ("Send", "Queue", "Wake up and send") with its tooltip. Its words show only for a step ("Connect Codex") or an action with `words`. With nothing to send it reads quiet (`data-empty`), and a press still says why.
- **The state line is the box's first band.** It shares the box's edges, divided from the field by a hairline. The field takes less room above it under the band. In a composer under 30rem the band's sentence sits closer to its edges, so a dock with a two-line band stays within a quarter of a 320 × 640 screen.
- **The live edge.** `live` marks the product's work running. The box's top edge becomes a line in the hue of work in progress (`--color-info`, never the primary's coral, C2). A light passes along it twice and then holds, as a live status dot pulses about five seconds (D95). Nothing moves under reduced motion.
- **The fit.** Options folds only the settings. When even the folded row does not fit (a phone's step in words, a product's `extras` beside Send), Options leaves out its summary (`data-bare`), and its name still says it.
- **Focus** is the box's border in the focus color with a soft glow inside it, never past its edge (CV-16).
- **The thread's compact line** keeps its words over a centred lane (`data-lane: center`).

Types: `types/button.d.ts` (new), `ComposerEntry`, `add`, `live`, `ChoiceMenuOption.calm`. React: `Composer`'s `add` and `live`.

## Executed checks

- **Unit suite:** 796 of 796 (`npm test`). New and updated cases:
  - `composing.test.mjs`: the + in both modes, bare glyph controls with their tooltip, Send's geometry and `data-empty`, the live edge bounded and in the progress hue, the field under the band;
  - `chip.test.mjs`: a calm option's state in the name and tooltip only, never the chip's own state;
  - `fit.test.mjs`: Options without its summary when even the folded row does not fit;
  - `fold`, `attach` and `icons`: the + never folds, Attach files, and the closed list's new glyphs.
- **Declarations:** `npm run types` passes.
- **Browser acceptance:** 355 checks in each of Chrome, Firefox and WebKit, installed from the packed archive into the `dom`, `react19` and `react18` consumers.
  - The first full runs passed 353 of 355 in each engine. The two that failed were `folding.mjs`'s Options checks, which still expected Claude Code's chips to fold at 320 px.
  - By their value, those chips now fit a 320 px phone in English, so the checks fold a running Codex turn's long chips at 390 and 320 px instead. They also assert that the plain dock keeps one row at 320 px, folded only where it does not fit (Spanish), and that Options' tooltip says its full name.
  - Run again, those checks passed 5 of 5 in each engine.
- **In a product:** Conduict's interface on this archive passes its unit tests and its conversation layout check in three engines (Conduict's `docs/reviews/2026-10-23/conversation-geometry.md`).

## Artifact

<!-- Filled once packed from the release commit. -->
