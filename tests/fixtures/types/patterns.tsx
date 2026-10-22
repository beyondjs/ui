import { Status, Skeleton, ListRow, CopyValue, Checklist, EmptyState, CommandCard } from '@beyond-js/ui/react';

export const state = <Status state="waking" variant="badge" />;
export const plain = <Status label="Ready" tone="success" />;
export const loading = <Skeleton rows={3} kind="table" />;
export const row = <ListRow title="web" href="/machines/web" meta={['Standard']} lead={{ state: 'ready' }} actions={[{ label: 'Wake', onSelect: () => undefined }]} menu={[{ label: 'Delete', tone: 'danger', onSelect: () => undefined }]} />;
export const copy = <CopyValue value="req_8f2c" label="the request identifier" />;
export const steps = <Checklist title="Set up" steps={[{ key: 'a', title: 'Create a machine', action: { label: 'Create', onSelect: () => undefined } }]} />;
export const empty = <EmptyState kind="context" title="Choose a project" action={{ label: 'Choose', onSelect: () => undefined }} />;
export const card = <CommandCard title="Run?" command="ls" onAllow={() => undefined} onDeny={() => undefined} focus />;

/** React phrasing content and native nodes share the DOM row's slots. */
export const rich = <ListRow title="web" meta={['Branch', <em key="branch">main</em>]} lead={<span>W</span>} status={<Status state="ready" />} facts={[<time key="age">Now</time>, 0]} actions={[null, { label: 'Open' }]} />;
export const native = <ListRow title={document.createElement('span')} meta={document.createElement('em')} facts={[document.createElement('span')]} lead={{ state: 'ready', label: <span>Ready</span> }} />;
