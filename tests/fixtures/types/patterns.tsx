import { Status, Skeleton, ListRow, CopyValue, Checklist, EmptyState, CommandCard } from '@beyond-js/ui/react';

export const state = <Status state="waking" variant="badge" />;
export const plain = <Status label="Ready" tone="success" />;
export const loading = <Skeleton rows={3} kind="table" />;
export const row = <ListRow title="web" href="/machines/web" meta={['Standard']} lead={{ state: 'ready' }} actions={[{ label: 'Wake', onSelect: () => undefined }]} menu={[{ label: 'Delete', tone: 'danger', onSelect: () => undefined }]} />;
export const copy = <CopyValue value="req_8f2c" label="the request identifier" />;
export const steps = <Checklist title="Set up" steps={[{ key: 'a', title: 'Create a machine', action: { label: 'Create', onSelect: () => undefined } }]} />;
export const empty = <EmptyState kind="context" title="Choose a project" action={{ label: 'Choose', onSelect: () => undefined }} />;
export const card = <CommandCard title="Run?" command="ls" onAllow={() => undefined} onDeny={() => undefined} focus />;
