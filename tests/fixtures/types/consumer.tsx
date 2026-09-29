// A React consumer as Delegate writes one (TypeScript, bundler resolution, react-jsx). It is
// compiled, never run: it proves the declarations of `@beyond-js/ui/react` accept real usage.
import { useRef, useState } from 'react';
import { Button, Dialog, Field, FocusedForm, Header, NotificationEntry, NotificationInbox, Picker, Collection, Help, Tooltip, ActionMenu, Select, Choices, useConfirm, useBusy, useToaster, FamilyBar, ProductNav, Unavailable, Badge, availability, type FamilyDescriptor, type NotificationAdapter, type NotificationEntryHandle, type PickerHandle } from '@beyond-js/ui/react';

declare const adapter: NotificationAdapter;
type Row = { id: string; title: string; votes: number };

export function Screen() {
	const [open, setOpen] = useState(false);
	const [theme, setTheme] = useState<string | null>('light');
	const picker = useRef<PickerHandle>(null);
	const bell = useRef<NotificationEntryHandle>(null);
	const questions = useConfirm({ accept: 'Aceptar', cancel: 'Cancelar' });
	const [busy, run] = useBusy();
	const toaster = useToaster();
	return (
		<>
			<FamilyBar product="delegate" brand={{ src: '/wordmark.svg', href: '/' }} descriptor={null as FamilyDescriptor | null} fallback={{ project: 'Storefront' }} notifications={<NotificationEntry adapter={adapter} />} account={{ signout: () => undefined, items: [{ label: 'Atajos', onSelect: () => setOpen(true) }] }} onNavigate={item => item.href} labels={{ signout: 'Cerrar sesión' }} />
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
			<Tooltip text="Copies the address"><button type="button">Copy</button></Tooltip>
			<ActionMenu name="More actions" items={[{ label: 'Rename', onSelect: () => setOpen(true) }, { label: 'Delete', disabled: true, reason: 'Owners only' }]} />
			<Select options={[{ value: 'en', label: 'English' }]} value="en" onChange={event => event.target.value} />
			<Choices legend="Theme" type="radio" options={[{ value: 'light', label: 'Light' }]} value={theme} onChange={setTheme} />
		</>
	);
}
