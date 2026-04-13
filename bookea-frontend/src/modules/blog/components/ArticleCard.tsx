import { format } from 'date-fns';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { blogService } from '../services/blog.service';
import type { Article } from '../types/blog.types';
import { savePendingBlogAction } from '../utils/pendingBlogActionStorage';
import styles from './ArticleCard.module.css';

const PREVIEW_LEN = 160;

type Props = { article: Article };

export function ArticleCard({ article }: Props) {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [localArticle, setLocalArticle] = useState(article);
	const [pending, setPending] = useState<'like' | 'dislike' | null>(null);

	function redirectToLoginForArticle() {
		const returnPath = `/blog/${localArticle.id}`;
		navigate(`/login?from=${encodeURIComponent(returnPath)}`, { state: { from: returnPath } });
	}

	useEffect(() => {
		setLocalArticle(article);
	}, [article]);

	const preview =
		localArticle.content.length <= PREVIEW_LEN
			? localArticle.content
			: `${localArticle.content.slice(0, PREVIEW_LEN).trim()}…`;

	let dateLabel = localArticle.createdAt;
	try {
		dateLabel = format(new Date(localArticle.createdAt), 'PP');
	} catch {
		// keep raw
	}

	async function handleLike() {
		if (authLoading) return;
		if (!isAuthenticated) {
			savePendingBlogAction({ type: 'LIKE', articleId: localArticle.id });
			redirectToLoginForArticle();
			return;
		}
		setPending('like');
		try {
			const updated = await blogService.likeArticle(localArticle.id);
			setLocalArticle(updated);
		} catch {
			/* keep counts; user may need to sign in */
		} finally {
			setPending(null);
		}
	}

	async function handleDislike() {
		if (authLoading) return;
		if (!isAuthenticated) {
			savePendingBlogAction({ type: 'DISLIKE', articleId: localArticle.id });
			redirectToLoginForArticle();
			return;
		}
		setPending('dislike');
		try {
			const updated = await blogService.dislikeArticle(localArticle.id);
			setLocalArticle(updated);
		} catch {
			/* keep counts; user may need to sign in */
		} finally {
			setPending(null);
		}
	}

	return (
		<article className={styles.card}>
			<div className={styles.imageWrap}>
				{localArticle.imageUrl ? (
					<img src={localArticle.imageUrl} alt="" className={styles.cover} loading="lazy" />
				) : (
					<div className={styles.coverPlaceholder}>No image</div>
				)}
			</div>
			<div className={styles.body}>
				<h2 className={styles.title}>{localArticle.title}</h2>
				<p className={styles.preview}>{preview}</p>
				<time className={styles.date} dateTime={localArticle.createdAt}>
					{dateLabel}
				</time>
				<div className={styles.footer}>
					<Link className={styles.readMore} to={`/blog/${localArticle.id}`}>
						Read more
					</Link>
					<div className={styles.reactions}>
						<button
							type="button"
							className={styles.reactionBtn}
							onClick={handleLike}
							disabled={pending !== null || authLoading}
							aria-label="Like"
						>
							<ThumbsUp size={18} strokeWidth={2} />
							<span className={styles.reactionCount}>{localArticle.likes}</span>
						</button>
						<button
							type="button"
							className={styles.reactionBtn}
							onClick={handleDislike}
							disabled={pending !== null || authLoading}
							aria-label="Dislike"
						>
							<ThumbsDown size={18} strokeWidth={2} />
							<span className={styles.reactionCount}>{localArticle.dislikes}</span>
						</button>
					</div>
				</div>
			</div>
		</article>
	);
}
