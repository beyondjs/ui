import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageHeader, Collection, ListRow, OrganizationMark, Button, Callout, Badge } from '@beyond-js/ui/react';
import { organizations, detail, body } from '../data/composition.js';

window.fixture = { ready: false, reads: 0, menu: 0 };
function View() {
 useLayoutEffect(() => { window.fixture.ready = true; }, []);
 return <Page header={<PageHeader title="Organizations" lead="Choose where to work." />}>
  <ul className="bui-rows" data-framed="" id="objects">{organizations.map(item => <ListRow key={item.id} title={item.name} href={`#${item.id}`} inline lead={<OrganizationMark name={item.name} />} meta={<Badge label={item.role} />} menu={[{ label: 'Settings', onSelect: () => { window.fixture.menu++; } }]} />)}</ul>
  <ul className="bui-rows" data-framed="" id="stacked"><ListRow title="Archive studio" href="#archive" lead={<OrganizationMark name="Archive studio" />} meta="Read only history" /></ul>
  <ul className="bui-rows" data-framed="" id="wrapped">{organizations.map(item => <li key={item.id}><ListRow tag="div" title={item.name} href={`#wrapped-${item.id}`} /></li>)}</ul>
  <div id="notice"><Callout tone="warning" title="Not available right now" body={body} actions={<Button label="Check the current machine state" onClick={() => { window.fixture.reads++; }} />} details={detail} /></div>
  <Callout body="A body-only notice." />
  <Collection label="Grouped objects" columns={[{ key: 'name', label: 'Name', primary: true }]} presentation="list" framed source={async () => ({ rows: organizations, total: 2 })} group={item => ({ key: item.role, label: item.role })} search={false} />
 </Page>;
}
createRoot(document.getElementById('root')).render(<StrictMode><View /></StrictMode>);
