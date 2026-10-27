import { AgainLine } from '../again/line.js';

/** English defaults of the notification entry and inbox; consumers replace any entry through `labels`. */
export const defaults = {
	...AgainLine.labels.en,
	title: 'Notifications',
	button: ({ count, more }) => (count === null || count === undefined ? 'Notifications' : count === 0 ? 'Notifications, none unread' : more ? `Notifications, ${count} or more unread` : `Notifications, ${count} unread`),
	badge: ({ count, more }) => (more ? `${count}+` : count > 99 ? '99+' : String(count)),
	loading: 'Loading notifications…',
	empty: 'No notifications yet.',
	caught: 'You are all caught up.',
	cleared: 'Nothing unread from {product}.',
	none: 'No notifications from {product}.',
	widen: 'Show all products',
	failure: 'Notifications could not be loaded.',
	retry: 'Try again',
	unavailable: 'Notifications are unavailable.',
	cause: 'Notifications are unavailable: {reason}.',
	not_configured: 'notifications are not connected to Beyond Projects',
	not_platform_session: 'your session is not a Beyond Accounts session',
	session_rejected: 'Beyond Projects could not confirm your access to them yet',
	projects_unavailable: 'Beyond Projects did not answer',
	accounts_unavailable: 'Beyond Accounts did not answer',
	silent: '{product} did not answer',
	unlisted: ({ count }) => (count === 1 ? 'Its notifications are not listed.' : 'Their notifications are not listed.'),
	view: 'View',
	all: 'View all notifications',
	everything: 'Mark all as read',
	mark: 'Mark as read',
	unmark: 'Mark as unread',
	unread: 'Unread',
	gone: 'This item is no longer available to you.',
	update: 'That change could not be saved. Try again.',
	more: 'Load more',
	show: 'Show',
	every: 'All',
	product: 'Product',
	products: 'All products',
	updates: ({ count }) => (count === 1 ? '1 update' : `${count} updates`),
	many: '{count}+ updates',
	resolved: 'Resolved on {date}',
	hide: 'Hide earlier updates',
	today: 'Today',
	earlier: 'Earlier'
};

/** The notification entry's and inbox's copy in Spanish (0.7.2; `NotificationEntry.labels.es`). */
export const spanish = {
	...AgainLine.labels.es,
	title: 'Notificaciones',
	button: ({ count, more }) => (count === null || count === undefined ? 'Notificaciones' : count === 0 ? 'Notificaciones, ninguna sin leer' : more ? `Notificaciones, ${count} o más sin leer` : `Notificaciones, ${count} sin leer`),
	badge: defaults.badge,
	loading: 'Cargando notificaciones…',
	empty: 'Todavía no hay notificaciones.',
	caught: 'Estás al día.',
	cleared: 'Nada sin leer de {product}.',
	none: 'No hay notificaciones de {product}.',
	widen: 'Mostrar todos los productos',
	failure: 'No se pudieron cargar las notificaciones.',
	retry: 'Reintentar',
	unavailable: 'Las notificaciones no están disponibles.',
	cause: 'Las notificaciones no están disponibles: {reason}.',
	not_configured: 'las notificaciones no están conectadas a Beyond Projects',
	not_platform_session: 'tu sesión no es una sesión de Beyond Accounts',
	session_rejected: 'Beyond Projects aún no pudo confirmar tu acceso a ellas',
	projects_unavailable: 'Beyond Projects no respondió',
	accounts_unavailable: 'Beyond Accounts no respondió',
	silent: '{product} no respondió',
	unlisted: 'Sus notificaciones no aparecen en la lista.',
	view: 'Ver',
	all: 'Ver todas las notificaciones',
	everything: 'Marcar todas como leídas',
	mark: 'Marcar como leída',
	unmark: 'Marcar como no leída',
	unread: 'Sin leer',
	gone: 'Este elemento ya no está disponible para ti.',
	update: 'No se pudo guardar ese cambio. Vuelve a intentarlo.',
	more: 'Cargar más',
	show: 'Mostrar',
	every: 'Todas',
	product: 'Producto',
	products: 'Todos los productos',
	updates: ({ count }) => (count === 1 ? '1 novedad' : `${count} novedades`),
	many: 'Más de {count} novedades',
	resolved: 'Resuelto el {date}',
	hide: 'Ocultar las novedades anteriores',
	today: 'Hoy',
	earlier: 'Anteriores'
};

/**
 * Why the inbox is unavailable, in the person's words (0.7.6). A relay's `{ available: false, reason }`
 * names the reason with one of `beyond-notifications/1`'s codes; the sentence says it when the code is
 * one of these, and is the plain `unavailable` sentence otherwise. Each code is also a label key.
 * `session_rejected` speaks of access, never of the session (0.9.1): only `Session`'s dialog speaks of
 * an ended session, and a product shows this reason only after `session.check()` answered `signed`.
 */
export class Cause {
	static codes = Object.freeze(['not_configured', 'not_platform_session', 'session_rejected', 'projects_unavailable', 'accounts_unavailable']);

	/** The sentence for `reason`, from a component's `Labels`. */
	static text(words, reason) {
		return Cause.codes.includes(reason) ? words.text('cause', { reason: words.text(reason) }) : words.text('unavailable');
	}
}

/** Both sets, as `NotificationEntry.labels` and `NotificationInbox.labels`. */
export const copies = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze(spanish) });
