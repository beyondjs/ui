/** The opt-in desktop rail preserves the standard Sidebar contract. */
import { Sidebar, type SidebarRailOptions } from '@beyond-js/ui';
const rail: SidebarRailOptions = { panel: 'conversations', open: false, order: ['home', 'conversations'], onchange: value => console.log(value) };
const sidebar = new Sidebar({ product: 'Conduict', rail, groups: [
	{ items: [{ key: 'home', label: 'Home', href: '/home', glyph: 'home' }, { key: 'settings', label: 'Settings', href: '/settings', glyph: 'settings' }] },
	{ kind: 'object', key: 'conversations', heading: 'Conversations', href: '/conversations', current: true, glyph: 'chat', groups: [] }
] });
sidebar.rail = { ...rail, open: true };
sidebar.rail = null;
// @ts-expect-error The rail is configured, never a second free-form DOM navigation.
sidebar.rail = true;
export { sidebar };

sidebar.navigation = { key: 'conduict', storage: null, onchange: collapsed => void collapsed };
sidebar.collapsed = true;
// @ts-expect-error a stable product key is required
sidebar.navigation = { collapsed: false };
