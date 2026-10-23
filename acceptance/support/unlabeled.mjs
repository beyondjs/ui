/**
 * The glyphs a control may show without a visible label (decision D11), as the checks expect them: the
 * owner's ten, `help` and `user` (0.3.0), and since 0.26.0 (D165) the composer's `plus`, `up`, `stop` and
 * `microphone` and an answer's `copy`, `link` and `undo`, with `check` as a bare copy's result. Kept here,
 * not read from the package, so a glyph added to the package's list without the owner's decision fails.
 */
export const unlabeled = Object.freeze(['close', 'menu', 'more', 'search', 'bell', 'chevron', 'pin', 'minimize', 'maximize', 'restore', 'help', 'user', 'plus', 'up', 'stop', 'microphone', 'copy', 'link', 'undo', 'check']);
