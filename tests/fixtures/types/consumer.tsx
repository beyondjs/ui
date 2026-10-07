// A React consumer as Delegate writes one (TypeScript, bundler resolution, react-jsx). It is
// compiled, never run: it proves the declarations of `@beyond-js/ui/react` accept real usage.
import { useRef, useState } from 'react';
import { Clock, Steps, Awaited, Freshness, TechnicalDetails, Button, Dialog, Field, FocusedForm, Header, NotificationEntry, NotificationInbox, Picker, Collection, Help, Tooltip, ActionMenu, Select, Choices, useConfirm, useBusy, useToaster, FamilyBar, ProductNav, Sidebar, Unavailable, Badge, availability, productNames, Icon, icons, Preferences, usePreferences, type FamilyDescriptor, type NotificationAdapter, type NotificationEntryHandle, type PickerHandle } from '@beyond-js/ui/react';

declare const adapter: NotificationAdapter;
type Row = { id: string; title: string; votes: number };
const beat = new Clock();
const preferences = new Preferences({ key: 'beyond-delegate', fallback: { appearance: 'system', locale: 'en' } });

export function Screen() {
	const [open, setOpen] = useState(false);
	const [theme, setTheme] = useState<string | null>('light');
	const picker = useRef<PickerHandle>(null);
	const bell = useRef<NotificationEntryHandle>(null);
	const questions = useConfirm({ accept: 'Aceptar', cancel: 'Cancelar' });
	const [busy, run] = useBusy();
	const toaster = useToaster();
	const { appearance, locale } = usePreferences(preferences);
	return (
		<>
			<FamilyBar product="delegate" brand={{ src: '/wordmark.svg', href: '/' }} descriptor={null as FamilyDescriptor | null} fallback={{ project: 'Storefront', links: { account: '/account', home: '/projects/' } }} notifications={<NotificationEntry adapter={adapter} products={productNames} />} account={{ signout: () => undefined, items: [{ label: 'Atajos', onSelect: () => setOpen(true) }] }} onNavigate={item => item.href} notice={{ text: 'Delegate isn’t set up for Northwind', action: { label: 'Try again', onSelect: () => setOpen(false) } }} transient={['dialog']} labels={{ signout: 'Cerrar sesión' }} />
			<Sidebar product="Delegate" groups={[{ heading: 'Project', items: [{ label: 'Requests', href: '/r', current: true }] }]} context="Storefront" cut={850} onNavigate={item => item.url} />
			<ProductNav items={[{ label: 'Pedidos', href: '/requests', current: true }]} onNavigate={item => item.href} />
			<Unavailable title="Aún no" reason="Por invitación." owner="Ana" action={<Button label="Pedir acceso" />} kind="capability" />
			{availability.map(entry => <Badge key={entry.key} label={entry.label} tone={entry.tone} />)}
			<Header brand={{ label: 'Beyond', href: '/' }} context={[{ label: 'Northwind', href: '/o' }]} notifications={<NotificationEntry ref={bell} adapter={adapter} href="#/notifications" locale="es" onView={() => bell.current?.more} labels={{ badge: ({ count, more }) => (more ? `${count}+` : String(count)) }} />} account={<span>Ana</span>} toggle={{ controls: 'rail', expanded: open, onChange: setOpen }} />
			<Button label="Delete" variant="danger" busy={busy} onClick={() => void run(async () => { if (await questions.confirm({ title: '¿Borrar?', tone: 'danger' })) toaster.show('Borrado'); })} />
			<Dialog open={open} title="Rename" onClose={() => setOpen(false)} actions={<Button label="Save" type="submit" />}>
				<Field label="Name" hint="Visible to members">
					<input name="name" required />
				</Field>
			</Dialog>
			<FocusedForm onSubmit={async values => void values.name}>{isBusy => <button type="submit">{isBusy ? 'Saving…' : 'Save'}</button>}</FocusedForm>
			<Picker ref={picker} label="Requests" source={async ({ query }) => ({ items: [{ id: query, label: query }], next: null })} onChange={items => items.map(item => item.state)} />
			<Collection<Row> label="Requests" columns={[{ key: 'title', label: 'Title', primary: true }, { key: 'votes', label: 'Votes', render: row => <strong>{row.votes}</strong> }]} source={async () => ({ rows: [], total: 0 })} link={row => `#/r/${row.id}`} onState={state => state.page} />
			<NotificationInbox adapter={adapter} products={{ delegate: 'Delegate' }} onState={state => state.state} />
			<Button label="Close notifications" onClick={() => (bell.current?.expanded ? bell.current.close() : bell.current?.open())} />
			<Help topic="Identifier" text="Never changes." />
			<Icon name="search" size={16} />
			<Icon name={icons[0]} label={`${appearance} ${locale}`} />
			<Tooltip text="Copies the address"><button type="button">Copy</button></Tooltip>
			<ActionMenu name="More actions" items={[{ label: 'Rename', onSelect: () => setOpen(true) }, { label: 'Delete', disabled: true, reason: 'Owners only' }]} />
			<Select options={[{ value: 'en', label: 'English' }]} value="en" onChange={event => event.target.value} />
			<Choices legend="Theme" type="radio" options={[{ value: 'light', label: 'Light' }]} value={theme} onChange={setTheme} />
			<Steps label="Preparing" steps={[{ label: 'Machine', state: 'progress', since: Date.now(), expected: { median: 60_000, p90: 120_000 }, phase: { label: 'Booting' } }]} clock={beat} labels={Steps.labels.es} />
			<Awaited title="Starting" since={Date.now()} expected={{ median: 120_000 }} check={async () => undefined} ended={open ? 'done' : null} onEnd={outcome => setOpen(outcome === 'done')} reason={{ text: 'Cannot reach it', action: { label: 'Open', onSelect: () => setOpen(false) } }} />
			<Freshness label="Running" tone="success" checked={new Date()} connected={false} />
			<TechnicalDetails text="refused" request="req_1" time={Date.now()} />
			<FamilyBar product="cdn" brand={{ src: '/w.svg', href: '/' }} account={{ signout: { end: async () => undefined, before: () => !open } }} />
		</>
	);
}

// The family page system (0.6.0, D52, D54) in React.
import { Page, PageHeader, Section, Arrival, Tabs } from '@beyond-js/ui/react';
export function Region() {
	const heading = useRef<HTMLHeadingElement>(null);
	const chosen = new Preferences({ key: 'beyond-region', fallback: { appearance: 'system', locale: 'en' } });
	return (
		<>
			<FamilyBar product="cdn" brand={{ src: '/w.svg', href: '/' }} account={{ preferences: { preferences: chosen, everywhere: '/account' } }} />
			<Page template="list" width="fluid" arrival={<Arrival product="Conduict" href="/back" onDismiss={() => undefined} />} header={<PageHeader title="Applications" headingRef={heading} tabs={<Tabs items={[{ label: 'All', href: '#all', current: true }]} />} />} aside={<p>Facts</p>}>
				<Section title="Recent" description="The last ten.">
					<p>None yet.</p>
				</Section>
			</Page>
		</>
	);
}

// "Choose, never type" (0.7.0) in React.
import { Picker as Chooser, ChoiceMenu, RefChooser, ProjectPicker, SecretField, CopyMessage, StatusRow, ProviderWindow, SideSheet, ListDetail, Field as Labelled, useSuggestion, Draft } from '@beyond-js/ui/react';
export function Choosing() {
	const name = useSuggestion('storefront');
	const secret = useRef<{ readonly value: string | null }>(null);
	const draft = Draft.read(window.location);
	return (
		<>
			<Chooser label="Repositories" source={async () => ({ items: [] })} accounts={{ items: [{ id: 'con_1', label: 'acme' }], connect: { label: 'Install on another GitHub organization', onSelect: () => undefined } }} gate={{ title: 'Connect GitHub', reason: 'Nothing is connected', action: <button>Connect GitHub</button> }} footer={<button>Choose on GitHub</button>} recognize={text => ({ label: text })} onRecognize={found => void found?.outcome} />
			<ChoiceMenu label="Environment" options={[{ value: 'web', label: 'web', status: ['Ready', 'success'] }]} actions={[{ label: 'New environment…', onSelect: () => undefined }]} onChange={value => void value} labels={ChoiceMenu.labels.es} />
			<RefChooser refs={[{ name: 'main', default: true }]} value="main" unavailable={null} onChange={value => void value} layout="inline" />
			<ProjectPicker product="Delegate" projects={[{ id: 'prj_1', name: 'Storefront' }]} onChange={id => void id} />
			<SecretField ref={secret} label="Supabase access" connect={{ label: 'Connect Supabase', onSelect: () => undefined }} stored />
			<CopyMessage text="Could you approve the Beyond app?" />
			<StatusRow title="acme" state={{ label: 'Active', tone: 'success' }} action={<button>Check now</button>} more={[{ label: 'Disconnect', onSelect: () => undefined }]} />
			<ProviderWindow provider="GitHub" href="/start" read={async () => ({ state: 'done' })} onEnd={outcome => void outcome} />
			<SideSheet open={false} title="Add repositories" busy={false} error={<p>Beyond Projects didn’t answer.</p>} onClose={value => void value}>
				<p>Body</p>
			</SideSheet>
			<ListDetail list={<ul />} detail={draft.empty ? null : <p>Detail</p>} back={{ label: 'Repositories', href: '?view=repositories' }} />
			<Labelled label="Slug" suggested={name.suggested}>
				<input value={name.value} onChange={name.onChange} onBlur={name.onBlur} />
			</Labelled>
		</>
	);
}

// 0.7.1 in React.
import { AwaitedLine, Choices as Group, Dialog as Modal, useConfirm as asking, Unavailable as Missing, useToaster as toasts } from '@beyond-js/ui/react';
export function Following() {
	const { confirm } = asking(asking.labels.es);
	toasts(toasts.labels.es);
	void [Modal.labels.es, Missing.labels.es, confirm];
	return (
		<>
			<Group legend="AI engine" type="radio" options={[{ value: 'claude', label: 'Claude Code', hint: 'Connected', status: ['Ready', 'success'] }]} value={null} />
			<AwaitedLine title="Cloning" since={Date.now()} expected={{ median: 60_000 }} ended={null} labels={AwaitedLine.labels.es} />
		</>
	);
}

// 0.7.2 in React.
import { Consequence, FamilyBar as Bar, Loading as Busy, NotificationEntry as Bell } from '@beyond-js/ui/react';
export function Consequential() {
	void [Bar.labels.es, Bell.labels.es];
	return (
		<>
			<Consequence parts={{ affected: <span>2 conversaciones</span>, costing: 'El disco' }} labels={Consequence.labels.es} />
			<Busy label={Busy.labels.es} />
			<Busy label={Busy.text({ name: 'Conduict', kind: 'opening' })} />
			<Tabs name="web" items={[{ label: 'Overview', href: '#o', current: true }]} />
		</>
	);
}
// 0.8.0: a session that ended, in React
import { useSession } from '@beyond-js/ui/react';
export function Signed({ person }: { person: { id: string; name: string } | null }) {
	const { session } = useSession({ product: 'delegate', person, read: async () => ({ state: 'signed', person }), start: mode => `/v1/auth/start?mode=${mode}` });
	void session?.lost({ replay: 'read' });
	void session?.check().then(state => state === 'signed');
	return <Bar product="delegate" brand={{ src: '/w.svg', href: '/' }} />;
}
