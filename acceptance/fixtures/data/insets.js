// The fictional words of the insets fixtures (D184): boxes no other page draws, each long enough to wrap so
// its content reaches the box's end. English for the DOM page, Spanish for the React pages.
export const words = {
	en: {
		info: { title: 'Machines sleep after 30 minutes without work', body: 'A machine that sleeps keeps its disk and wakes up when a conversation needs it, so nothing you started is lost while it waits.', action: 'Change the idle time', other: 'Keep it awake' },
		warning: { title: 'This machine is almost full', body: 'It has 2 GB left of its 40 GB disk. Delete old copies or choose a larger size before the next build fills it.' },
		danger: { title: 'The snapshot did not finish', body: 'Storefront kept its earlier snapshot. Start the snapshot again once the machine answers.', details: { text: 'capture: storage did not answer within 30 s', request: 'req_insets_7Hq2' } },
		empty: { title: 'No machines yet', text: 'A machine runs the conversations of this project, with the AI engines you sign in on it.', action: 'Create a machine' },
		checklist: { title: 'Set up Storefront', steps: [{ key: 'repository', title: 'Add a repository', state: 'done' }, { key: 'machine', title: 'Create a machine', detail: 'It runs your conversations and keeps their copies.', action: { label: 'Create a machine' } }, { key: 'engine', title: 'Sign in an AI engine', detail: 'Claude Code or Codex, with your own subscription.' }] },
		section: { title: 'About', text: 'This machine runs the conversations of Storefront and keeps a copy of each repository the project grants it, read and pushed only through its Git gateway.' },
		notes: { label: 'Notes', value: 'Wake it before the release review.\nIt keeps the build cache warm.' },
		refusal: { title: 'Workspace is not open to you yet', reason: 'Development environments open by invitation, one organization at a time.', owner: 'An owner of Northwind Studio' },
		toast: { title: 'Machine renamed', detail: 'Its conversations keep their history and their copies.' }
	},
	es: {
		info: { title: 'Las máquinas se duermen tras 30 minutos sin trabajo', body: 'Una máquina que duerme conserva su disco y se despierta cuando una conversación la necesita, así que no se pierde nada de lo que empezaste mientras espera.', action: 'Cambiar el tiempo de espera', other: 'Mantenerla despierta' },
		warning: { title: 'Esta máquina está casi llena', body: 'Le quedan 2 GB de su disco de 40 GB. Borra copias antiguas o elige un tamaño mayor antes de que la próxima compilación lo llene.' },
		danger: { title: 'La instantánea no terminó', body: 'Storefront conservó su instantánea anterior. Vuelve a empezarla cuando la máquina responda.', details: { text: 'capture: storage did not answer within 30 s', request: 'req_insets_7Hq2' } },
		empty: { title: 'Todavía no hay máquinas', text: 'Una máquina ejecuta las conversaciones de este proyecto, con los motores de IA en los que inicias sesión en ella.', action: 'Crear una máquina' },
		checklist: { title: 'Prepara Storefront', steps: [{ key: 'repository', title: 'Añade un repositorio', state: 'done' }, { key: 'machine', title: 'Crea una máquina', detail: 'Ejecuta tus conversaciones y conserva sus copias.', action: { label: 'Crear una máquina' } }, { key: 'engine', title: 'Inicia sesión en un motor de IA', detail: 'Claude Code o Codex, con tu propia suscripción.' }] },
		section: { title: 'Acerca de', text: 'Esta máquina ejecuta las conversaciones de Storefront y conserva una copia de cada repositorio que el proyecto le concede, leído y enviado solo a través de su pasarela de Git.' },
		notes: { label: 'Notas', value: 'Despiértala antes de la revisión de la versión.\nMantiene caliente la caché de compilación.' },
		refusal: { title: 'Workspace aún no está abierto para ti', reason: 'Los entornos de desarrollo se abren por invitación, una organización cada vez.', owner: 'Quien administra Northwind Studio' },
		toast: { title: 'Máquina renombrada', detail: 'Sus conversaciones conservan su historial y sus copias.' }
	}
};
