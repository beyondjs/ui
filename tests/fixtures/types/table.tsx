import { DataTable, Collection } from '@beyond-js/ui/react';

interface Row { id: string; name: string }
export const table = <DataTable<Row> label="Rows" columns={[{ key: 'name', label: 'Name', sort: true, render: row => <strong>{row.name}</strong> }]} rows={[{ id: '1', name: 'a' }]} rowKey={row => row.id} status={{ failed: null }} onRetry={() => undefined} onChange={state => state.query} />;
export const list = <Collection<Row> label="Rows" presentation="list" columns={[{ key: 'name', label: 'Name' }]} source={async () => ({ rows: [] })} />;
