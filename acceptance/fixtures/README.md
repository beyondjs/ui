# Installed component fixtures

The acceptance harness copies these source files into temporary DOM, React 18 and React 19 consumers, installs the selected UI archive and builds them there. It never mutates fixture source.

The composition examples enter through `dom/composition.html` / `dom/composition.js` and `react/composition.html` / `react/composition.jsx`; `data/composition.js` supplies fictional organizations and technical evidence. They have no service access. The checks cover real links, independent menus, a safe simulated read counter, long names, contained grouped lists and body-only notices. `acceptance/checks/composition.mjs` exercises them with the ordinary `npm run acceptance` runner. The navigation examples enter through the existing navigation HTML/JS/JSX files and exercise global navigation with and without a contextual object panel.

Other fixture groups remain described by `docs/validation.md`, their consuming check and any local README.

`dom/table-clearance.html` and `react/table-clearance.html` draw framed comparison tables with fictional members. They cover `menu(row)`, a product-owned menu column (React content through its portal), long names and rows without actions. `checks/table-clearance.mjs` checks painted target clearance, name alignment, containment and activation at 320/390 px with fine/coarse input in both themes; each menu stays wholly above the metadata line.
