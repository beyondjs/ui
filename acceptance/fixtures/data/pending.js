// The words of the pending pages (0.44.0, LOAD-01, D185): a snapshot read after its page is drawn, in
// English for the DOM consumer and in Spanish for the React ones. `?refused=1` makes its read refuse Restore.
export const refused = new URLSearchParams(location.search).get('refused') === '1';

export const words = {
	en: { home: 'Home', projects: 'Projects', create: 'New', title: 'snap-2026-10-27', snapshots: 'Snapshots', facts: 'Compared with', restore: 'Restore', more: 'More actions', overview: 'Overview', files: 'Files', devices: 'Devices', away: 'Sign out of other devices', device: 'This Mac · Safari', history: 'History', change: 'Captured by Ana', from: 'Beyond Projects' },
	es: { home: 'Inicio', projects: 'Proyectos', create: 'Nuevo', title: 'snap-2026-10-27', snapshots: 'Snapshots', facts: 'Comparado con', restore: 'Restaurar', more: 'Más acciones', overview: 'Resumen', files: 'Archivos', devices: 'Dispositivos', away: 'Cerrar sesión en otros dispositivos', device: 'Este Mac · Safari', history: 'Historial', change: 'Capturado por Ana', from: 'Beyond Projects' }
};

/** The snapshots it is compared with: a ChoiceMenu in the facts line */
export const earlier = [
	{ value: 'snap-2026-10-26', label: 'snap-2026-10-26' },
	{ value: 'snap-2026-10-20', label: 'snap-2026-10-20' }
];

export const projects = ['Storefront', 'Payments', 'Docs Site'].map((label, index) => ({ key: `p${index}`, label, href: `#/projects/p${index}` }));
