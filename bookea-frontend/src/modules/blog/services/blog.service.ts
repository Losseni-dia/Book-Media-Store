import type { Article, ArticleCreateInput, Comment, CommentModeration, CommentModerationStatus } from '../types/blog.types';

const BASE = '/api/blog';

async function parseJson<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || res.statusText || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

const postJson = (url: string, body: unknown) =>
	fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(body),
	});

export const blogService = {
	async getArticles(search?: string, signal?: AbortSignal): Promise<Article[]> {
		const q = search?.trim();
		const url =
			q && q.length > 0
				? `${BASE}/articles?search=${encodeURIComponent(q)}`
				: `${BASE}/articles`;
		const res = await fetch(url, { signal });
		return parseJson<Article[]>(res);
	},

	/** Admin: all articles including soft-deleted (restore UI). Requires admin session. */
	async getArticlesForAdmin(): Promise<Article[]> {
		const res = await fetch(`${BASE}/admin/articles`, { credentials: 'include' });
		return parseJson<Article[]>(res);
	},

	/**
	 * Toggles `active` (public visibility). Admin only — PATCH /api/blog/articles/:id/status
	 */
	async toggleArticleStatus(id: string | number): Promise<Article> {
		const res = await fetch(`${BASE}/articles/${id}/status`, {
			method: 'PATCH',
			credentials: 'include',
		});
		return parseJson<Article>(res);
	},

	async getArticleById(id: string | number): Promise<Article> {
		const res = await fetch(`${BASE}/articles/${id}`);
		return parseJson<Article>(res);
	},

	async getComments(articleId: string | number): Promise<Comment[]> {
		const res = await fetch(`${BASE}/articles/${articleId}/comments`);
		return parseJson<Comment[]>(res);
	},

	async addComment(articleId: string | number, content: string): Promise<Comment> {
		const res = await postJson(`${BASE}/articles/${articleId}/comments`, { content });
		return parseJson<Comment>(res);
	},

	/** Admin: multipart upload — returns API path e.g. `/api/blog/images/uuid.jpg`. */
	async uploadImage(file: File): Promise<string> {
		const form = new FormData();
		form.append('file', file);
		const res = await fetch(`${BASE}/images`, {
			method: 'POST',
			credentials: 'include',
			body: form,
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || res.statusText || `HTTP ${res.status}`);
		}
		return (await res.text()).trim();
	},

	async createArticle(input: ArticleCreateInput): Promise<Article> {
		const res = await postJson(`${BASE}/articles`, input);
		return parseJson<Article>(res);
	},

	async updateArticle(id: string | number, data: ArticleCreateInput): Promise<Article> {
		const res = await fetch(`${BASE}/admin/articles/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data),
		});
		return parseJson<Article>(res);
	},

	/** Admin: update comment text — PUT /api/blog/admin/comments/:id */
	async updateComment(id: string | number, data: { content: string }): Promise<CommentModeration> {
		const res = await fetch(`${BASE}/admin/comments/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data),
		});
		return parseJson<CommentModeration>(res);
	},

	/**
	 * Soft-delete: sets `deleted = true` on the server (204 No Content). Admin only — DELETE /api/blog/articles/:id
	 */
	async deleteArticle(id: string | number): Promise<void> {
		const res = await fetch(`${BASE}/articles/${id}`, {
			method: 'DELETE',
			credentials: 'include',
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || res.statusText || `HTTP ${res.status}`);
		}
	},

	/** Admin: undo soft-delete — PUT /api/blog/articles/:id/restore */
	async restoreArticle(id: string | number): Promise<Article> {
		const res = await fetch(`${BASE}/articles/${id}/restore`, {
			method: 'PUT',
			credentials: 'include',
		});
		return parseJson<Article>(res);
	},

	async likeArticle(id: string | number): Promise<Article> {
		const res = await fetch(`${BASE}/${id}/like`, {
			method: 'POST',
			credentials: 'include',
		});
		return parseJson<Article>(res);
	},

	async dislikeArticle(id: string | number): Promise<Article> {
		const res = await fetch(`${BASE}/${id}/dislike`, {
			method: 'POST',
			credentials: 'include',
		});
		return parseJson<Article>(res);
	},

	async getPendingComments(): Promise<CommentModeration[]> {
		const res = await fetch(`${BASE}/admin/comments/pending`, { credentials: 'include' });
		return parseJson<CommentModeration[]>(res);
	},

	async getRecentUserCommentsForModeration(): Promise<CommentModeration[]> {
		const res = await fetch(`${BASE}/admin/comments/recent-from-users`, { credentials: 'include' });
		return parseJson<CommentModeration[]>(res);
	},

	async moderateComment(id: string | number, status: Exclude<CommentModerationStatus, 'PENDING'>): Promise<CommentModeration> {
		const res = await fetch(`${BASE}/admin/comments/${id}/moderation`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ status }),
		});
		return parseJson<CommentModeration>(res);
	},
};
