/**
 * The options of `Composer` (its constructor's one argument). The components guide, "Conversations",
 * says what each does.
 *
 * @typedef {object} ComposerOptions
 * @property {string} label the field's accessible name ("Message to Claude Code"), never drawn
 * @property {(message: {text: string, action: string, attachments: object[]}) => Promise<unknown>} onsubmit sends; a rejection gives the text back
 * @property {string|null} [placeholder] what sending will do ("Message Claude Code…")
 * @property {string|Node|null} [status] the state line, the box's first band since 0.26.0
 * @property {Array<Node|{element: Node}>} [tools] the toolbar's start
 * @property {Array<Node|{element: Node}>} [extras] the toolbar's end, before the actions
 * @property {Array<{id: string, label: string, primary?: boolean, words?: boolean}>|null} [actions] the ways to send ("Send" by default); the primary is its glyph alone unless `words` (0.26.0)
 * @property {{label: string, run: () => unknown, busy?: boolean}|null} [stop] the stop action while work runs
 * @property {{reason?: string|null, place?: (() => HTMLElement|null|undefined)|null}|null} [disabled] sending is unavailable, why, and where a press on Send puts the person (`place`, 0.34.0)
 * @property {boolean} [busy] the product's own work: nothing is sent meanwhile
 * @property {'enter'|'mod'} [submit] whether Enter sends on a hardware keyboard (default `'enter'`)
 * @property {string} [value] the text, such as a kept draft
 * @property {number} [min] the field's lines when empty (1)
 * @property {number} [max] the lines before it scrolls (12)
 * @property {string|null} [name] the field's form name
 * @property {(text: string) => void} [onchange] the text changed, by the person or by sending
 * @property {((error: unknown) => string|null)} [explain] what a rejected send says
 * @property {Array<Node|{element: Node}>} [settings] the turn's choices at the toolbar's start (0.11.0)
 * @property {object|null} [attach] `{ label?, accept?, multiple?, onfiles(files, via), onremove?(item), onretry?(item), zone?, words? }` (0.11.0; `zone` since 0.11.2; `words`, what ready files wait for, since 0.32.0)
 * @property {Array<object>} [attachments] the chips: `{ key, name, size?, type?, state, progress?, reason?, thumbnail?, file? }` (0.11.0)
 * @property {((query: string, signal: AbortSignal) => Promise<unknown>)|null} [onsuggest] suggestions after the trigger (0.11.0)
 * @property {{trigger?: string, bound?: number, delay?: number, label?: string|null, explain?: ((error: unknown) => string|null)|null}|null} [suggest]
 * @property {string} [locale] the language of sizes and percents (the runtime's by default)
 * @property {boolean} [compact] whether the toolbar keeps one row by shortening its chips and, last, folding behind Options (0.11.1, measured since 0.11.2; default true)
 * @property {string|null} [summary] what sending uses, said by Options while the settings are folded (0.11.2)
 * @property {Array<Node|{element: Node}>} [tray] compact chips on the box's lower edge (0.14.0)
 * @property {Array<{value: string, label?: string, detail?: string, run?: Function}>|((query: string, signal: AbortSignal) => unknown)|null} [commands] after "/" at the start (0.14.0)
 * @property {(() => string|null|Promise<string|null>)|null} [recall] ArrowUp in an empty field brings this text back (0.14.0)
 * @property {{transcribe: Function, cap?: number, bound?: number, minimum?: number, explain?: Function}|null} [dictation] offers Dictate (0.14.0)
 * @property {Array<{label: string, run: Function, keys?: string}>} [add] the **+** menu's entries after Attach files (0.26.0)
 * @property {boolean} [live] the product's work runs now: the box's edge shows it (0.26.0)
 */
export {};
