import { useEffect, useRef, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { blogService } from '../services/blog.service';
import type { Article } from '../types/blog.types';
import styles from './BlogPage.module.css';

/** Client-side guard: hide inactive or soft-deleted rows if the API ever returns them. */
function isPublicVisibleArticle(a: Article): boolean {
	const active = a.active ?? true;
	const deleted = a.deleted ?? false;
	return active === true && deleted === false;
}

/** First occurrence wins — avoids duplicate cards if the payload ever repeats an id. */
function uniqueArticlesById(items: Article[]): Article[] {
	const seen = new Set<number>();
	const out: Article[] = [];
	for (const a of items) {
		if (seen.has(a.id)) continue;
		seen.add(a.id);
		out.push(a);
	}
	return out;
}

export function BlogPage() {
	const [articles, setArticles] = useState<Article[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	/** Bumps on each effect run so late responses from a previous run are ignored (StrictMode / fast typing). */
	const fetchGenerationRef = useRef(0);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		const generation = ++fetchGenerationRef.current;

		setLoading(true);
		setError(null);

		(async () => {
			try {
				const data = await blogService.getArticles(searchQuery || undefined, signal);
				if (signal.aborted || generation !== fetchGenerationRef.current) return;
				const visible = uniqueArticlesById(data.filter(isPublicVisibleArticle));
				setArticles(visible);
			} catch (err) {
				if (signal.aborted || generation !== fetchGenerationRef.current) return;
				if (err instanceof DOMException && err.name === 'AbortError') return;
				setError(err instanceof Error ? err.message : 'Failed to load articles');
				setArticles([]);
			} finally {
				if (!signal.aborted && generation === fetchGenerationRef.current) {
					setLoading(false);
				}
			}
		})();

		return () => {
			controller.abort();
		};
	}, [searchQuery]);

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<h1 className={styles.title}>Blog</h1>
				<div className={styles.searchBar}>
					<input
						type="search"
						placeholder="Search by title…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						aria-label="Search articles"
					/>
				</div>
				{loading ? (
					<p className={styles.message}>Loading articles…</p>
				) : error ? (
					<p className={`${styles.message} ${styles.error}`}>{error}</p>
				) : articles.length === 0 ? (
					<p className={styles.message}>No articles found.</p>
				) : (
					<div className={styles.grid}>
						{articles.map((article) => (
							<ArticleCard key={article.id} article={article} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
