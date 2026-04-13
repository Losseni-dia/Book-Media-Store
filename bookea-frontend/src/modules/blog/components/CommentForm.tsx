import { FormEvent, useEffect, useState } from 'react';
import { blogService } from '../services/blog.service';
import type { Comment } from '../types/blog.types';
import { clearPendingBlogAction, savePendingBlogAction } from '../utils/pendingBlogActionStorage';

export type CommentFormUi = {
	form?: string;
	label?: string;
	textarea?: string;
	button?: string;
	error?: string;
};

type Props = {
	articleId: number;
	onCommentAdded: (comment: Comment) => void;
	ui?: CommentFormUi;
	/** When false and `onRequireLogin` is set, submit redirects to login instead of calling the API. */
	isAuthenticated?: boolean;
	authLoading?: boolean;
	onRequireLogin?: () => void;
	/** Draft restored after login; cleared from storage once applied to the textarea. */
	intentCommentDraft?: string | null;
	onIntentCommentDraftApplied?: () => void;
};

export function CommentForm({
	articleId,
	onCommentAdded,
	ui,
	isAuthenticated = true,
	authLoading = false,
	onRequireLogin,
	intentCommentDraft = null,
	onIntentCommentDraftApplied,
}: Props) {
	const [content, setContent] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (intentCommentDraft == null || intentCommentDraft === '') return;
		setContent(intentCommentDraft);
		clearPendingBlogAction();
		onIntentCommentDraftApplied?.();
	}, [intentCommentDraft, onIntentCommentDraftApplied]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = content.trim();
		if (!trimmed) return;

		if (authLoading) return;
		if (!isAuthenticated) {
			savePendingBlogAction({ type: 'COMMENT', articleId, payload: trimmed });
			onRequireLogin?.();
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			const comment = await blogService.addComment(articleId, trimmed);
			setContent('');
			onCommentAdded(comment);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to post comment');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className={ui?.form}>
			<label htmlFor={`comment-${articleId}`} className={ui?.label}>
				Add a comment
			</label>
			<textarea
				id={`comment-${articleId}`}
				rows={4}
				value={content}
				onChange={(e) => setContent(e.target.value)}
				disabled={submitting}
				placeholder="Share your thoughts…"
				className={ui?.textarea}
			/>
			{error ? <p className={ui?.error}>{error}</p> : null}
			<button type="submit" className={ui?.button} disabled={submitting || !content.trim()}>
				{submitting ? 'Posting…' : 'Post comment'}
			</button>
		</form>
	);
}
