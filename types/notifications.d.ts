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
}

/** One product's reach in a Beyond Projects answer; `unavailable` means its items are hidden. */
export interface NoticeSource {
	product: string;
	state: 'available' | 'unavailable' | (string & {});
}

export interface NoticeSummary {
	/** False when the aggregation cannot be reached or is not configured. */
	available?: boolean;
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
	items: Notice[];
	next?: unknown;
	/** Products whose items are hidden because they did not answer (a product relay's shape). */
	unavailable?: string[];
	/** Each product's reach (Beyond Projects' shape); `state: 'unavailable'` is the partial signal. */
	sources?: NoticeSource[];
}

export interface NoticeRequest {
	state: 'unread' | 'all';
	product: string | null;
	cursor: unknown;
	limit: number;
}

/** What the notification components call. They never perform business actions. */
export interface NotificationAdapter {
	summary(): Promise<NoticeSummary>;
	list(request: NoticeRequest): Promise<NoticePage>;
	read(target: string[] | { before: string; product?: string }): Promise<unknown>;
	unread(ids: string[]): Promise<unknown>;
	/** Rechecks access, marks read and returns the destination; rejects with `code: 'NOT_FOUND'` when gone. */
	open(id: string): Promise<{ destination: string | null }>;
}

export type Copy = Record<string, string | ((values: Record<string, unknown>) => string)>;
