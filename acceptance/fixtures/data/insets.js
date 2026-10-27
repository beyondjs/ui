// The fictional words of the insets fixtures (D184): boxes no other page draws, each long enough to wrap so
// its content reaches the box's end. English for the DOM page, Spanish for the React pages. Since 0.35.0 an
// editable request's command, an outage whose words wrap beside Try again and a choice of one-line entries;
// since 0.41.0 a table of jobs, drawn in a framed box, and since 0.44.0 the line a product draws above it at times.
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
		toast: { title: 'Machine renamed', detail: 'Its conversations keep their history and their copies.' },
		command: { title: 'Claude Code asks to run a command', text: 'npm run build && npm test -- --coverage' },
		recovery: { cause: 'Beyond Accounts did not answer', read: 'The project', said: 'Beyond Accounts is unavailable (UNAVAILABLE)' },
		copy: { label: 'Run this on the machine', command: 'npm run dev -- --port 4317' },
		effort: { label: 'Effort', options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
		jobs: { label: 'Jobs', updated: 'Last updated 2 min ago', columns: { job: 'Job', state: 'State', organization: 'Organization', started: 'Started' }, rows: [['Prepare storefront', 'Running', 'Nimbus Studio', '10:42'], ['Deliver release 14', 'Finished', 'Quartz Collective', '10:31'], ['Prepare docs', 'Failed', 'Nimbus Studio', '09:58'], ['Purge old outputs', 'Finished', 'Quartz Collective', '09:12']] }
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
		toast: { title: 'Máquina renombrada', detail: 'Sus conversaciones conservan su historial y sus copias.' },
		command: { title: 'Claude Code pide ejecutar un comando', text: 'npm run build && npm test -- --coverage' },
		recovery: { cause: 'Beyond Accounts no respondió', read: 'El proyecto', said: 'Beyond Accounts no está disponible (UNAVAILABLE)' },
		copy: { label: 'Ejecuta esto en la máquina', command: 'npm run dev -- --port 4317' },
		effort: { label: 'Esfuerzo', options: [{ value: 'low', label: 'Bajo' }, { value: 'medium', label: 'Medio' }, { value: 'high', label: 'Alto' }] },
		jobs: { label: 'Trabajos', updated: 'Última actualización hace 2 min', columns: { job: 'Trabajo', state: 'Estado', organization: 'Organización', started: 'Empezó' }, rows: [['Preparar storefront', 'En curso', 'Nimbus Studio', '10:42'], ['Entregar la versión 14', 'Terminó', 'Quartz Collective', '10:31'], ['Preparar la documentación', 'Falló', 'Nimbus Studio', '09:58'], ['Purgar salidas antiguas', 'Terminó', 'Quartz Collective', '09:12']] }
	}
};

/** A table of jobs as `DataTable` takes it (0.41.0): its columns and rows, each row opening its job. */
export function jobs(copy) {
	const columns = Object.entries(copy.jobs.columns).map(([key, label], index) => ({ key, label, ...(index === 0 ? { primary: true } : {}) }));
	const rows = copy.jobs.rows.map(([job, state, organization, started], index) => ({ id: `job_${index}`, job, state, organization, started }));
	return { label: copy.jobs.label, columns, rows, link: row => `#/jobs/${row.id}` };
}
