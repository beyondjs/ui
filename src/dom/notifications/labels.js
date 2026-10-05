/** English defaults of the notification entry and inbox; consumers replace any entry through `labels`. */
export const defaults = {
	title: 'Notifications',
	button: ({ count, more }) => (count === null || count === undefined ? 'Notifications' : count === 0 ? 'Notifications, none unread' : more ? `Notifications, ${count} or more unread` : `Notifications, ${count} unread`),
	badge: ({ count, more }) => (more ? `${count}+` : count > 99 ? '99+' : String(count)),
	loading: 'Loading notifications…',
	empty: 'No notifications yet.',
	caught: 'You are all caught up.',
	failure: 'Notifications could not be loaded.',
	retry: 'Try again',
	unavailable: 'Notifications are unavailable right now. Everything else works.',
	partial: ({ products }) => `Some products could not be reached (${products}). Their notifications are hidden until they answer.`,
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
	hide: 'Hide earlier updates'
};

/** The notification entry's and inbox's copy in Spanish (0.7.2; `NotificationEntry.labels.es`). */
export const spanish = {
	title: 'Notificaciones',
	button: ({ count, more }) => (count === null || count === undefined ? 'Notificaciones' : count === 0 ? 'Notificaciones, ninguna sin leer' : more ? `Notificaciones, ${count} o más sin leer` : `Notificaciones, ${count} sin leer`),
	badge: defaults.badge,
	loading: 'Cargando notificaciones…',
	empty: 'Todavía no hay notificaciones.',
	caught: 'Estás al día.',
	failure: 'No se pudieron cargar las notificaciones.',
	retry: 'Reintentar',
	unavailable: 'Las notificaciones no están disponibles ahora. Todo lo demás funciona.',
	partial: ({ products }) => `Algunos productos no respondieron (${products}). Sus notificaciones no se muestran hasta que respondan.`,
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
	hide: 'Ocultar las novedades anteriores'
};

/** Both sets, as `NotificationEntry.labels` and `NotificationInbox.labels`. */
export const copies = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze(spanish) });
