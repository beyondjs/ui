import React from 'react';
import { Collection, DataTable, icon, type CollectionTools, type DataTableFilter, type UnlabeledIconName } from '@beyond-js/ui';
import { Collection as ReactCollection, DataTable as ReactTable } from '@beyond-js/ui/react';

const target = document.createElement('div');
const filters: DataTableFilter<{ owner: string }>[] = [{ name: 'owner', label: 'Whose', all: 'Everyone', options: [{ value: 'mine', label: 'Mine' }], match: (row, value) => row.owner === value }];
const tools: CollectionTools = new Collection.Tools({ label: 'Machines', filters, compact: true, delay: 0, state: { query: 'cedar', filters: { owner: 'mine' } }, onchange: state => state.filters.owner.toUpperCase(), labels: Collection.Tools.labels.es });
tools.mount(target);
tools.state = { filters: { owner: 'mine' } };
tools.focus();
tools.destroy();

const collection = new Collection({ label: 'Machines', columns: [{ key: 'owner', label: 'Owner' }], source: async request => ({ rows: [{ owner: request.filters.owner }] }), filters, tools: 'external' });
target.append(collection.tools.element);
collection.tools.state = { query: 'mine' };

const table = new DataTable({ label: 'Machines', columns: [{ key: 'owner', label: 'Owner' }], rows: [{ owner: 'mine' }], filters, tools: 'expanded', state: { filters: { owner: 'mine' } }, onchange: state => state.filters?.owner.toUpperCase() });
table.tools.focus();
table.state = { filters: {} };

const compact = <ReactTable label="Machines" rows={[{ owner: 'mine' }]} columns={[{ key: 'owner', label: 'Owner' }]} filters={filters} tools="external" toolsTarget={target} state={{ filters: { owner: 'mine' } }} onChange={state => state.filters?.owner.toUpperCase()} />;
const expanded = <ReactCollection label="Machines" columns={[{ key: 'owner', label: 'Owner' }]} source={async request => ({ rows: [{ owner: request.filters.owner }] })} filters={filters.map(filter => ({ ...filter, label: 'Whose' }))} tools="expanded" toolsTarget={null} />;
icon('filter');
// @ts-expect-error Filters retains a visible label; it is not in the closed unlabeled set.
const unlabeled: UnlabeledIconName = 'filter';
// @ts-expect-error The toolbar mode is a closed choice.
new Collection.Tools({ label: 'Machines', compact: 'external' });
// @ts-expect-error The React outlet is a DOM container, not a second React toolbar.
const invalid = <ReactTable label="Machines" columns={[]} toolsTarget={<div />} />;
void [compact, expanded, invalid, unlabeled];
