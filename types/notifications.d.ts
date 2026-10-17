/** The data a notification adapter returns, as a product relays `beyond-notifications/1`. */
export interface Notice {
	id: string;
	product: string;
	kind?: string;
	/** Rendered by the producer at read time, after rechecking access. */
	title: string;
	summary?: string | null;
	occurred: string;
	/** ISO time it was read, or null while unread. */
	read: string | null;
	group?: string | null;
	/** The whole matter of a page read `by: 'matter'` (0.15.0): its updates, unread ones, and `more` past what was counted. */
	updates?: { count: number; unread: number; more?: boolean } | null;
	/** When the matter was resolved (0.15.0): it leaves the unread count; a later update reopens it. */
	resolved?: string | null;
}

/** One product's reach in a Beyond Projects answer; `unavailable` means its items are hidden. */
export interface NoticeSource {
	product: string;
	state: 'available' | 'unavailable' | (string & {});
}

export interface NoticeSummary {
	/** False when the aggregation cannot be reached or is not configured. */
	available?: boolean;
	/** Why it is unavailable: `not_configured`, `not_platform_session`, `session_rejected`, `projects_unavailable` or `accounts_unavailable` (0.7.6). */
	reason?: string | null;
	/** Unread count, or null when unknown. Beyond Projects counts up to a bound (0–99). */
	unread?: number | null;
	/** True when counting stopped at the bound: the count is shown as "N+". */
	more?: boolean;
	/** Products whose items are hidden because they did not answer (a product relay's shape). */
	unavailable?: string[];
	/** Each product's reach (Beyond Projects' shape); `state: 'unavailable'` is the partial signal. */
	sources?: NoticeSource[];
}

export interface NoticePage {
	available?: boolean;
	/** Why it is unavailable, as on `NoticeSummary`; the inbox's sentence says it (0.7.6). */
	reason?: string | null;
	items: Notice[];
	next?: unknown;
	/** Products whose items are hidden because they did not answer (a product relay's shape). */
	unavailable?: string[];
	/** Each product's reach (Beyond Projects' shape); `state: 'unavailable'` is the partial signal. */
	sources?: NoticeSource[];
	/** True (or `by: 'matter'`) when the relay answered a page of matters (0.15.0); items carrying `updates` say it too. */
	grouped?: boolean;
	by?: 'matter';
}

export interface NoticeRequest {
	state: 'unread' | 'all';
	product: string | null;
	cursor: unknown;
	/** Items, or matters when `by` is `matter`. */
	limit: number;
	/** 0.15.0 (X-07): a page of matters (`GET /v1/notifications?by=matter`); a relay that ignores it answers items and the inbox reads on. */
	by?: 'matter';
}

/** What the notification components call. They never perform business actions. */
export interface NotificationAdapter {
	summary(): Promise<NoticeSummary>;
	list(request: NoticeRequest): Promise<NoticePage>;
	read(target: string[] | { before: string; product?: string }): Promise<unknown>;
	unread(ids: string[]): Promise<unknown>;
	/**
	 * Marks every update of one matter read (0.15.0, X-07), loaded or not: Beyond Projects'
	 * `POST /v1/notifications/read` with `{ product, group }`. Optional: without it the loaded updates are marked.
	 */
	readGroup?(matter: { product: string; group: string }): Promise<unknown>;
	/** Marks every update of one matter unread (0.15.0): `POST /v1/notifications/unread` with `{ product, group }`. Optional. */
	unreadGroup?(matter: { product: string; group: string }): Promise<unknown>;
	/** Rechecks access, marks read and returns the destination; rejects with `code: 'NOT_FOUND'` when gone. */
	open(id: string): Promise<{ destination: string | null }>;
}

export type Copy = Record<string, string | ((values: Record<string, unknown>) => string)>;
