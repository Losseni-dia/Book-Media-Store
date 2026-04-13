export const PENDING_BLOG_ACTION_KEY = 'pendingBlogAction';

export type PendingBlogAction =
	| { type: 'COMMENT'; articleId: number; payload: string }
	| { type: 'LIKE' | 'DISLIKE'; articleId: number };

export function savePendingBlogAction(action: PendingBlogAction): void {
	sessionStorage.setItem(PENDING_BLOG_ACTION_KEY, JSON.stringify(action));
}

export function readPendingBlogAction(): PendingBlogAction | null {
	const raw = sessionStorage.getItem(PENDING_BLOG_ACTION_KEY);
	if (!raw) return null;
	try {
		const v = JSON.parse(raw) as unknown;
		if (!v || typeof v !== 'object') {
			clearPendingBlogAction();
			return null;
		}
		const o = v as Record<string, unknown>;
		const articleId = Number(o.articleId);
		if (!Number.isFinite(articleId)) {
			clearPendingBlogAction();
			return null;
		}
		if (o.type === 'COMMENT' && typeof o.payload === 'string') {
			return { type: 'COMMENT', articleId, payload: o.payload };
		}
		if (o.type === 'LIKE' || o.type === 'DISLIKE') {
			return { type: o.type, articleId };
		}
		clearPendingBlogAction();
		return null;
	} catch {
		clearPendingBlogAction();
		return null;
	}
}

export function clearPendingBlogAction(): void {
	sessionStorage.removeItem(PENDING_BLOG_ACTION_KEY);
}
