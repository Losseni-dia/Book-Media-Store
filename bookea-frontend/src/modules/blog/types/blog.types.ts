export interface Article {
	id: number;
	title: string;
	content: string;
	createdAt: string;
	updatedAt?: string;
	imageUrl?: string | null;
	likes: number;
	dislikes: number;
	active?: boolean;
	deleted?: boolean;
}

export type CommentModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Comment {
	id: number;
	content: string;
	authorUsername: string;
	createdAt: string;
	status?: CommentModerationStatus;
}

/** Admin moderation row (includes article context). */
export interface CommentModeration {
	id: number;
	articleId: number;
	articleTitle: string;
	content: string;
	authorUsername: string;
	createdAt: string;
	status: CommentModerationStatus;
}

export interface ArticleCreateInput {
	title: string;
	content: string;
	/** Absent = leave unchanged on create semantics; `null` clears image on update when sent. */
	imageUrl?: string | null;
}
