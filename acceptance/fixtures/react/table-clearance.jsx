import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DataTable, ActionMenu } from '@beyond-js/ui/react';
import { columns, rows } from '../data/table-clearance.js';

window.fixture = { ready: false, chosen: null };
function View() {
	useLayoutEffect(() => { window.fixture.ready = true; }, []);
	const actions = row => row.id === 'none' ? [] : [{ label: `Open ${row.name}`, onSelect: () => { window.fixture.chosen = row.id; } }];
	const own = { key: 'actions', label: 'Actions', menu: true, value: () => '', render: row => row.id === 'none' ? null : <><ActionMenu label={null} name={`Actions for ${row.name}`} items={actions(row)} /><span hidden>Additional product state</span></> };
	return <>{['native', 'column'].map(mode => <section className="bui-raised" id={mode} key={mode}>
		<DataTable label={`${mode} menus`} columns={mode === 'column' ? [...columns, own] : columns} rows={rows} menu={mode === 'native' ? actions : null} search={false} framed />
	</section>)}</>;
}
createRoot(document.getElementById('root')).render(<StrictMode><View /></StrictMode>);
