import { DataTable, Collection } from '@beyond-js/ui/react';

interface Row { id: string; name: string }
export const table = <DataTable<Row> label="Rows" columns={[{ key: 'name', label: 'Name', sort: true, render: row => <strong>{row.name}</strong> }]} rows={[{ id: '1', name: 'a' }]} rowKey={row => row.id} status={{ failed: null }} onRetry={() => undefined} onChange={state => state.query} />;
// A row's actions in a menu column of its own (0.44.0), items as React's ActionMenu takes them
export const menus = <DataTable<Row> label="Rows" columns={[{ key: 'name', label: 'Name', sort: true }]} rows={[{ id: '1', name: 'a' }]} framed menu={row => [{ label: `Rename ${row.name}`, onSelect: () => undefined }, false, { label: 'Delete', tone: 'danger' }]} />;
export const list = <Collection<Row> label="Rows" presentation="list" columns={[{ key: 'name', label: 'Name' }]} source={async () => ({ rows: [] })} />;
