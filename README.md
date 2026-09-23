# Beyond UI

`@beyond-js/ui` is Beyond's shared interface package: the canonical design tokens, framework-free DOM components, a React adapter over the same components and one stylesheet. It serves products written in React (Delegate) and in plain JavaScript DOM classes (the family reference, Branding) with one behavior implementation.

**Status: version 0.1.2, implemented and verified locally, not published.** 0.1.1 corrected four defects that product adoptions found in 0.1.0 (see the [evidence](docs/reviews/2026-09-23/implementation-evidence.md#011-corrections)), and 0.1.2 corrects the React `Dialog`, which closed itself under `StrictMode` (see [0.1.2 corrections](docs/reviews/2026-09-23/implementation-evidence.md#012-corrections)); its token set is unchanged and keeps its own version, 0.1.0. The package is distributed as a vendored tarball that consumers install from their own `tools/` directory. It is not on a registry. Branding consumes its tokens. No product consumes its components yet: adoption in Delegate, Branding and the other products is separate, later work. The [implementation evidence](docs/reviews/2026-09-23/implementation-evidence.md) records what ran and what is not established.

## What it contains

| Public module | Contents |
| --- | --- |
| `@beyond-js/ui` and `@beyond-js/ui/dom` | DOM component classes: `Button`, `ActionMenu`, `Disclosure`, `Field`, `Choices`, `Select`, `Picker`, `Dialog`, `confirm`/`prompt`/`alert`, `FocusedForm`, `Tooltip`, `Help`, `Collection`, `Toaster`, `Header`, `NotificationEntry`, `NotificationInbox`, and the builders `status`, `badge`, `callout`, `loading`, `skeleton` |
| `@beyond-js/ui/react` | The React 18/19 adapter: the same components as React components and hooks (`useConfirm`, `useBusy`, `useToaster`) |
| `@beyond-js/ui/tokens` | The canonical token data (`tokens`, with its own version, `status` and provenance), `TokenSheet` and `Contrast`. The token set version (0.1.0) changes only when a token changes, independently of the package version |
| `@beyond-js/ui/tokens.css` | The generated token custom properties, both themes (`data-beyond-mode`, then the system preference) |
| `@beyond-js/ui/styles.css` | Every component style (`bui-` classes), using token custom properties only |

The [component catalog](docs/components.md) describes each component, its options, states and usage guidance. [Architecture](docs/architecture.md) records the decisions.

## Consume it

Prerequisite: Node.js 22.21.1 or later.

1. In this repository, `npm install` once, then `npm run pack:consumers -- <consumer directory>`. That runs `npm pack`, writes `dist-pack/beyond-ui-<version>.tgz` (currently `beyond-ui-0.1.2.tgz`) with its `sha512` integrity beside it, and copies the tarball into `<consumer directory>/tools/`.
2. In the consumer, declare `"@beyond-js/ui": "file:tools/beyond-ui-0.1.2.tgz"` (a dependency, or a devDependency when a bundler builds the product) and run `npm install`.
3. Import the two stylesheets once, then the components:

```js
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import { Dialog, Picker } from '@beyond-js/ui';          // plain DOM
import { Dialog, Picker, useConfirm } from '@beyond-js/ui/react'; // React
```

React consumers need `react` and `react-dom` 18.2 or later (peer dependencies). TypeScript declarations ship with every module. Every component takes a `labels` option (a `labels` prop in React) for its copy; products pass their own language, and English is only the default.

## Work here

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md), [coding standards](docs/coding-standards.md) and [validation](docs/validation.md).

| Command | What it does |
| --- | --- |
| `npm run build` | Writes `dist/tokens.css`, `dist/tokens.json` and `dist/styles.css` (also run by `npm test` and `npm pack`) |
| `npm test` | Contract and unit tests with Node's test runner over happy-dom |
| `npm run types` | Compiles typed plain DOM and React consumers against the declarations |
| `npm run acceptance` | Packs the package, installs it into a plain DOM, a React 19 and a React 18 consumer and runs the browser checks in the installed Google Chrome |
| `npm run pack:consumers -- <dir>…` | Packs for vendoring and copies the tarball into consumers |

UI is a library: it has no development server, no port and no suite selector service. The acceptance pages under `acceptance/fixtures/` are a test harness, not an application.

Maintained guides belong in `docs/`, dated evidence in `docs/reviews/`, and temporary assignments in [docs-temp](docs-temp/README.md).
