import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ThumbsDown, ThumbsUp, UserCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { CommentForm } from '../components/CommentForm';
import { blogService } from '../services/blog.service';
import type { Article, Comment } from '../types/blog.types';
import {
	clearPendingBlogAction,
	readPendingBlogAction,
	savePendingBlogAction,
} from '../utils/pendingBlogActionStorage';
import styles from './BlogDetailPage.module.css';

function formatArticleDate(iso: string) {
	try {
		return format(new Date(iso), 'PPp');
	} catch {
		return iso;
	}
}

/** Relative for recent comments; calendar date for older (check-in friendly). */
function formatCommentTime(iso: string) {
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		const hoursApart = Math.abs(Date.now() - d.getTime()) / 3_600_000;
		if (hoursApart < 168) {
			return formatDistanceToNow(d, { addSuffix: true });
		}
		return format(d, 'MMM d, yyyy');
	} catch {
		return iso;
	}
}

export function BlogDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [article, setArticle] = useState<Article | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState<'like' | 'dislike' | null>(null);
	const [intentCommentDraft, setIntentCommentDraft] = useState<string | null>(null);

	const clearIntentCommentDraft = useCallback(() => {
		setIntentCommentDraft(null);
	}, []);

	function redirectToLogin() {
		const returnPath = `${location.pathname}${location.search}${location.hash}`;
		navigate(`/login?from=${encodeURIComponent(returnPath)}`, { state: { from: returnPath } });
	}

	useEffect(() => {
		if (!id) {
			setArticle(null);
			setComments([]);
			setLoading(false);
			setError('Missing article id');
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		Promise.all([blogService.getArticleById(id), blogService.getComments(id)])
			.then(([a, c]) => {
				if (!cancelled) {
					setArticle(a);
					setComments(c);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Failed to load article');
					setArticle(null);
					setComments([]);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [id]);

	useEffect(() => {
		if (!isAuthenticated || authLoading || !article || !id) return;

		const action = readPendingBlogAction();
		if (!action) return;
		if (Number(action.articleId) !== Number(article.id)) return;

		if (action.type === 'COMMENT') {
			setIntentCommentDraft(action.payload);
			return;
		}

		clearPendingBlogAction();
		const reaction: 'like' | 'dislike' = action.type === 'LIKE' ? 'like' : 'dislike';
		setPending(reaction);
		void (async () => {
			try {
				const updated =
					action.type === 'LIKE'
						? await blogService.likeArticle(article.id)
						: await blogService.dislikeArticle(article.id);
				setArticle(updated);
			} catch {
				/* keep counts */
			} finally {
				setPending(null);
			}
		})();
	}, [isAuthenticated, authLoading, article, id]);

	function handleCommentAdded(comment: Comment) {
		setComments((prev) => [comment, ...prev]);
	}

	async function handleLike() {
		if (!article) return;
		if (authLoading) return;
		if (!isAuthenticated) {
			savePendingBlogAction({ type: 'LIKE', articleId: article.id });
			redirectToLogin();
			return;
		}
		setPending('like');
		try {
			const updated = await blogService.likeArticle(article.id);
			setArticle(updated);
		} catch {
			/* e.g. 401 if not authenticated */
		} finally {
			setPending(null);
		}
	}

	async function handleDislike() {
		if (!article) return;
		if (authLoading) return;
		if (!isAuthenticated) {
			savePendingBlogAction({ type: 'DISLIKE', articleId: article.id });
			redirectToLogin();
			return;
		}
		setPending('dislike');
		try {
			const updated = await blogService.dislikeArticle(article.id);
			setArticle(updated);
		} catch {
			/* e.g. 401 if not authenticated */
		} finally {
			setPending(null);
		}
	}

	if (!id) {
		return (
			<div className={styles.page}>
				<div className={styles.container}>
					<p className={`${styles.message} ${styles.error}`}>Invalid link.</p>
					<Link to="/blog" className={styles.backButton}>
						<ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
						Back to blog
					</Link>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className={styles.page}>
				<div className={styles.container}>
					<p className={styles.message}>Loading…</p>
				</div>
			</div>
		);
	}

	if (error || !article) {
		return (
			<div className={styles.page}>
				<div className={styles.container}>
					<p className={`${styles.message} ${styles.error}`}>{error ?? 'Article not found.'}</p>
					<Link to="/blog" className={styles.backButton}>
						<ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
						Back to blog
					</Link>
				</div>
			</div>
		);
	}

	const articleIdNum = Number(article.id);
	const discussionCount = comments.length;

	const formUi = {
		form: styles.composerForm,
		label: styles.composerLabel,
		textarea: styles.composerTextarea,
		button: styles.composerSubmit,
		error: styles.composerError,
	};

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<Link to="/blog" className={styles.backButton}>
					<ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
					Back to blog
				</Link>
				<div className={styles.articlePanel}>
					<div className={styles.hero}>
						{article.imageUrl ? (
							<img src={article.imageUrl} alt="" className={styles.heroImg} />
						) : (
							<div className={styles.heroPlaceholder}>No cover image</div>
						)}
					</div>
					<div className={styles.articleInner}>
						<article className={styles.articleContent}>
							<h1>{article.title}</h1>
							<p className={styles.meta}>
								<time dateTime={article.createdAt}>{formatArticleDate(article.createdAt)}</time>
							</p>
							<div className={styles.body}>{article.content}</div>
						</article>
						<div className={styles.reactions}>
							<button
								type="button"
								className={styles.reactionBtn}
								onClick={handleLike}
								disabled={pending !== null || authLoading}
								aria-label="Like"
							>
								<ThumbsUp size={20} strokeWidth={2} />
								<span className={styles.reactionCount}>{article.likes}</span>
							</button>
							<button
								type="button"
								className={styles.reactionBtn}
								onClick={handleDislike}
								disabled={pending !== null || authLoading}
								aria-label="Dislike"
							>
								<ThumbsDown size={20} strokeWidth={2} />
								<span className={styles.reactionCount}>{article.dislikes}</span>
							</button>
						</div>
					</div>
				</div>
				<section className={styles.commentsSection} aria-labelledby="discussion-heading">
					<div className={styles.discussionHeader}>
						<h2 id="discussion-heading" className={styles.discussionTitle}>
							Discussion
						</h2>
						<span className={styles.discussionCount} aria-live="polite">
							({discussionCount})
						</span>
					</div>
					{comments.length === 0 ? (
						<p className={styles.emptyComments}>No comments yet—start the thread below.</p>
					) : (
						<ul className={styles.commentList}>
							{comments.map((c) => (
								<li key={c.id} className={styles.commentBubble}>
									<div className={styles.avatar} aria-hidden>
										<UserCircle size={22} strokeWidth={1.75} />
									</div>
									<div className={styles.bubbleCard}>
										<div className={styles.bubbleMeta}>
											<span className={styles.author}>{c.authorUsername}</span>
											{c.status === 'PENDING' ? (
												<span className={styles.pendingBadge} title="Visible to you until a moderator approves it">
													Pending
												</span>
											) : null}
											<time className={styles.timestamp} dateTime={c.createdAt}>
												{formatCommentTime(c.createdAt)}
											</time>
										</div>
										<p className={styles.commentBody}>{c.content}</p>
									</div>
								</li>
							))}
						</ul>
					)}
					<CommentForm
						articleId={articleIdNum}
						onCommentAdded={handleCommentAdded}
						ui={formUi}
						onRequireLogin={redirectToLogin}
						isAuthenticated={isAuthenticated}
						authLoading={authLoading}
						intentCommentDraft={intentCommentDraft}
						onIntentCommentDraftApplied={clearIntentCommentDraft}
					/>
				</section>
			</div>
		</div>
	);
}
