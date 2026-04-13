import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArticleForm } from '../components/ArticleForm';
import { blogService } from '../services/blog.service';
import type { Article, ArticleCreateInput, CommentModeration } from '../types/blog.types';
import styles from './AdminBlogPage.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const ITEMS_PER_PAGE = 10;

function articleToFormInput(a: Article): ArticleCreateInput {
	return {
		title: a.title,
		content: a.content,
		imageUrl: a.imageUrl ?? '',
	};
}

function formatTableDate(iso: string | undefined) {
	if (!iso) return '—';
	try {
		return format(new Date(iso), 'MMM d, yyyy, p');
	} catch {
		return iso;
	}
}

export function AdminBlogPage() {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Article | null>(null);
	const [formSubmitting, setFormSubmitting] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
	const [deleteSubmitting, setDeleteSubmitting] = useState(false);
	const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
	const [restoreBusyId, setRestoreBusyId] = useState<number | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [pendingComments, setPendingComments] = useState<CommentModeration[]>([]);
	const [recentUserComments, setRecentUserComments] = useState<CommentModeration[]>([]);
	const [moderationBusyId, setModerationBusyId] = useState<number | null>(null);
	const [commentEditTarget, setCommentEditTarget] = useState<CommentModeration | null>(null);
	const [commentEditText, setCommentEditText] = useState('');
	const [commentEditSubmitting, setCommentEditSubmitting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = useMemo(
		() => (articles.length === 0 ? 0 : Math.ceil(articles.length / ITEMS_PER_PAGE)),
		[articles.length],
	);
	const currentArticles = useMemo(
		() =>
			articles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
		[articles, currentPage],
	);

	useEffect(() => {
		if (articles.length === 0) return;
		const lastPage = Math.ceil(articles.length / ITEMS_PER_PAGE);
		if (currentPage > lastPage) setCurrentPage(lastPage);
	}, [articles.length, currentPage]);

	const loadCommentModeration = useCallback(async () => {
		try {
			const [p, r] = await Promise.all([
				blogService.getPendingComments(),
				blogService.getRecentUserCommentsForModeration(),
			]);
			setPendingComments(p);
			setRecentUserComments(r);
		} catch {
			setPendingComments([]);
			setRecentUserComments([]);
		}
	}, []);

	const refresh = useCallback(async () => {
		setError(null);
		const data = await blogService.getArticlesForAdmin();
		setArticles(data);
	}, []);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		blogService
			.getArticlesForAdmin()
			.then((data) => {
				if (!cancelled) setArticles(data);
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Failed to load articles');
					setArticles([]);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		void loadCommentModeration();
	}, [loadCommentModeration]);

	useEffect(() => {
		if (!successMessage) return;
		const t = window.setTimeout(() => setSuccessMessage(null), 5000);
		return () => clearTimeout(t);
	}, [successMessage]);

	function openCreate() {
		setEditing(null);
		setFormOpen(true);
		setError(null);
	}

	function openEdit(a: Article) {
		setEditing(a);
		setFormOpen(true);
		setError(null);
	}

	function closeForm() {
		setFormOpen(false);
		setEditing(null);
	}

	async function handleFormSubmit(data: ArticleCreateInput) {
		setFormSubmitting(true);
		setError(null);
		try {
			if (editing) {
				await blogService.updateArticle(editing.id, data);
			} else {
				await blogService.createArticle(data);
			}
			await refresh();
			closeForm();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Save failed (are you logged in as admin?)');
		} finally {
			setFormSubmitting(false);
		}
	}

	const formInitialValues = useMemo(
		() => (editing ? articleToFormInput(editing) : undefined),
		[editing?.id, editing?.title, editing?.content, editing?.imageUrl],
	);

	async function handleToggleStatus(a: Article) {
		if (a.deleted) return;
		setStatusBusyId(a.id);
		setError(null);
		try {
			await blogService.toggleArticleStatus(a.id);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update status');
		} finally {
			setStatusBusyId(null);
		}
	}

	async function handleRestore(a: Article) {
		setRestoreBusyId(a.id);
		setError(null);
		try {
			await blogService.restoreArticle(a.id);
			setSuccessMessage('Article restored.');
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Restore failed (admin session required?)');
		} finally {
			setRestoreBusyId(null);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleteSubmitting(true);
		setError(null);
		try {
			await blogService.deleteArticle(deleteTarget.id);
			setDeleteTarget(null);
			setSuccessMessage('Article deleted.');
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Delete failed');
		} finally {
			setDeleteSubmitting(false);
		}
	}

	async function handleModerateComment(row: CommentModeration, decision: 'APPROVED' | 'REJECTED') {
		setModerationBusyId(row.id);
		setError(null);
		try {
			await blogService.moderateComment(row.id, decision);
			await loadCommentModeration();
			setSuccessMessage(decision === 'APPROVED' ? 'Comment approved.' : 'Comment rejected.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Moderation failed');
		} finally {
			setModerationBusyId(null);
		}
	}

	function openCommentEdit(row: CommentModeration) {
		setCommentEditTarget(row);
		setCommentEditText(row.content);
		setError(null);
	}

	function closeCommentEdit() {
		if (commentEditSubmitting) return;
		setCommentEditTarget(null);
		setCommentEditText('');
	}

	async function handleCommentEditSave() {
		if (!commentEditTarget) return;
		const trimmed = commentEditText.trim();
		if (!trimmed) {
			setError('Le commentaire ne peut pas être vide.');
			return;
		}
		setCommentEditSubmitting(true);
		setError(null);
		try {
			await blogService.updateComment(commentEditTarget.id, { content: trimmed });
			await loadCommentModeration();
			setSuccessMessage('Commentaire mis à jour.');
			setCommentEditTarget(null);
			setCommentEditText('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Échec de la mise à jour du commentaire');
		} finally {
			setCommentEditSubmitting(false);
		}
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.topBarInner}>
					<div className={styles.titleBlock}>
						<h1 className={styles.title}>Blog dashboard</h1>
						<p className={styles.subtitle}>Create, edit, delete, restore, and toggle visibility (admin only)</p>
					</div>
					<div className={styles.actions}>
						<Link to="/blog" className={styles.btnGhost}>
							View public blog
						</Link>
						<button type="button" className={styles.btnPrimary} onClick={openCreate}>
							+ Add new article
						</button>
					</div>
				</div>
			</header>

			<div className={styles.container}>
				{successMessage && !formOpen ? (
					<div className={`${styles.message} ${styles.messageSuccess}`} role="status">
						{successMessage}
					</div>
				) : null}
				{error && !formOpen && !deleteTarget ? (
					<div className={`${styles.message} ${styles.messageError}`} role="alert">
						{error}
					</div>
				) : null}

				<div className={styles.card} style={{ marginBottom: '1rem' }}>
					<div className="p-3 p-md-4">
						<h2 className={styles.modSectionTitle}>5 most recent user comments</h2>
						<p className={styles.modSectionHint}>
							Newest comments from non-admin accounts (quick scan for moderation).
						</p>
						{recentUserComments.length === 0 ? (
							<p className="text-secondary small mb-0">No recent user comments to show.</p>
						) : (
							<div className={styles.tableWrap}>
								<table className="table table-sm table-hover mb-0 align-middle">
									<thead>
										<tr>
											<th className={styles.tableHead}>Article</th>
											<th className={styles.tableHead}>Author</th>
											<th className={styles.tableHead}>Excerpt</th>
											<th className={styles.tableHead}>Status</th>
											<th className={styles.tableHead}>Submitted</th>
											<th className={styles.tableHead} style={{ width: '1%' }}>
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{recentUserComments.map((c) => (
											<tr key={c.id}>
												<td className="small">
													<Link to={`/blog/${c.articleId}`}>{c.articleTitle}</Link>
												</td>
												<td className="small text-secondary">{c.authorUsername}</td>
												<td className="small" style={{ maxWidth: 280 }}>
													{c.content.length > 120 ? `${c.content.slice(0, 120)}…` : c.content}
												</td>
												<td>
													<span className="badge bg-secondary text-uppercase">{c.status}</span>
												</td>
												<td className="text-secondary small text-nowrap">{formatTableDate(c.createdAt)}</td>
												<td className="text-nowrap">
													<button
														type="button"
														className={styles.btnSmOrange}
														disabled={moderationBusyId === c.id || commentEditSubmitting}
														onClick={() => openCommentEdit(c)}
													>
														Éditer
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				<div className={styles.card} style={{ marginBottom: '1rem' }}>
					<div className="p-3 p-md-4">
						<h2 className={styles.modSectionTitle}>Pending comments</h2>
						<p className={styles.modSectionHint}>Approve or reject before they appear on the public article.</p>
						{pendingComments.length === 0 ? (
							<p className="text-secondary small mb-0">No comments awaiting approval.</p>
						) : (
							<div className={styles.tableWrap}>
								<table className="table table-hover mb-0 align-middle">
									<thead>
										<tr>
											<th className={styles.tableHead}>Article</th>
											<th className={styles.tableHead}>Author</th>
											<th className={styles.tableHead}>Comment</th>
											<th className={styles.tableHead}>Submitted</th>
											<th className={styles.tableHead} style={{ width: '1%' }}>
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{pendingComments.map((c) => (
											<tr key={c.id}>
												<td className="small">
													<Link to={`/blog/${c.articleId}`}>{c.articleTitle}</Link>
												</td>
												<td className="small text-secondary">{c.authorUsername}</td>
												<td className="small">{c.content}</td>
												<td className="text-secondary small text-nowrap">{formatTableDate(c.createdAt)}</td>
												<td className="text-nowrap">
													<button
														type="button"
														className={`${styles.btnSmOrange} me-1`}
														disabled={moderationBusyId === c.id || commentEditSubmitting}
														onClick={() => openCommentEdit(c)}
													>
														Éditer
													</button>
													<button
														type="button"
														className="btn btn-sm btn-success me-1"
														disabled={moderationBusyId === c.id}
														onClick={() => handleModerateComment(c, 'APPROVED')}
													>
														Approve
													</button>
													<button
														type="button"
														className="btn btn-sm btn-outline-danger"
														disabled={moderationBusyId === c.id}
														onClick={() => handleModerateComment(c, 'REJECTED')}
													>
														Reject
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				<div className={styles.card}>
					{loading ? (
						<div className={`${styles.message} ${styles.messageInfo} m-0 border-0`}>Loading articles…</div>
					) : articles.length === 0 ? (
						<div className={`${styles.message} ${styles.messageInfo} m-0 border-0`}>
							No articles yet. Use &quot;Add new article&quot; to create one.
						</div>
					) : (
						<div className={styles.articleSection}>
							<div className={styles.tableWrap}>
								<table
									className={`table table-hover table-striped mb-0 align-middle ${styles.articleTable}`}
								>
									<thead>
										<tr>
											<th className={styles.tableHead}>ID</th>
											<th className={styles.tableHead}>Title</th>
											<th className={`${styles.tableHead} ${styles.numHead}`}>Likes</th>
											<th className={`${styles.tableHead} ${styles.numHead}`}>Dislikes</th>
											<th className={styles.tableHead}>Created</th>
											<th className={styles.tableHead}>Last updated</th>
											<th className={styles.tableHead}>Status</th>
											<th className={styles.tableHead} style={{ width: '1%' }}>
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{currentArticles.map((a) => {
											const isActive = a.active ?? true;
											const isDeleted = !!a.deleted;
											return (
												<tr key={a.id} className={isDeleted ? styles.tableRowDeleted : undefined}>
													<td className={`text-secondary small ${styles.idCell}`}>{a.id}</td>
													<td className={`fw-medium ${styles.titleCell}`}>{a.title}</td>
													<td className={styles.numCell}>{a.likes}</td>
													<td className={styles.numCell}>{a.dislikes}</td>
													<td className="text-secondary small text-nowrap">{formatTableDate(a.createdAt)}</td>
													<td className="text-secondary small text-nowrap">{formatTableDate(a.updatedAt)}</td>
													<td>
														<div className={styles.statusCell}>
															<div className="form-check form-switch mb-0">
																<input
																	className={`form-check-input ${styles.statusSwitch}`}
																	type="checkbox"
																	role="switch"
																	id={`article-status-${a.id}`}
																	checked={isActive}
																	disabled={isDeleted || statusBusyId === a.id}
																	onChange={() => handleToggleStatus(a)}
																	aria-checked={isActive}
																	aria-label={isActive ? 'Set article inactive' : 'Set article active'}
																/>
															</div>
															<span
																className={`${styles.statusLabel} ${isActive ? styles.statusLabelActive : styles.statusLabelInactive}`}
															>
																{statusBusyId === a.id ? '…' : isActive ? 'Active' : 'Inactive'}
															</span>
														</div>
													</td>
													<td className={styles.actionTd}>
														<div className={styles.actionCell}>
															<button
																type="button"
																className={styles.btnSmOrange}
																onClick={() => openEdit(a)}
																disabled={isDeleted}
																title={isDeleted ? 'Restaurer l’article avant modification' : undefined}
															>
																Éditer
															</button>
															{isDeleted ? (
																<button
																	type="button"
																	className={styles.btnSmRestore}
																	disabled={restoreBusyId === a.id}
																	onClick={() => handleRestore(a)}
																>
																	{restoreBusyId === a.id ? '…' : 'Restore'}
																</button>
															) : (
																<button type="button" className={styles.btnSmDanger} onClick={() => setDeleteTarget(a)}>
																	Delete
																</button>
															)}
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							<footer className={styles.paginationFooter} aria-label="Pagination des articles">
								<button
									type="button"
									className={styles.paginationBtn}
									disabled={currentPage <= 1}
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								>
									Précédent
								</button>
								<span className={styles.paginationInfo}>
									Page {currentPage} sur {totalPages}
								</span>
								<button
									type="button"
									className={styles.paginationBtn}
									disabled={currentPage >= totalPages}
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								>
									Suivant
								</button>
							</footer>
						</div>
					)}
				</div>
			</div>

			{formOpen ? (
				<div
					className={styles.modalBackdrop}
					role="presentation"
					onClick={(e) => {
						if (e.target === e.currentTarget && !formSubmitting) closeForm();
					}}
				>
					<div className={`${styles.modalDialog} ${styles.modalDialogWide}`} role="dialog" aria-modal="true" aria-labelledby="article-form-title">
						<div className={styles.modalContent}>
							<div className={styles.modalHeader}>
								<h2 id="article-form-title" className={styles.modalTitle}>
									{editing ? 'Modifier l’article' : 'Nouvel article'}
								</h2>
								<button type="button" className={styles.modalClose} onClick={() => !formSubmitting && closeForm()} aria-label="Close">
									×
								</button>
							</div>
							<div className={styles.modalBody}>
								{error ? (
									<div className="alert alert-danger py-2 small mb-3" role="alert">
										{error}
									</div>
								) : null}
								<ArticleForm
									key={editing?.id ?? 'new'}
									initialValues={formInitialValues}
									submitLabel={editing ? 'Enregistrer' : 'Créer l’article'}
									submitting={formSubmitting}
									onSubmit={handleFormSubmit}
									onCancel={() => !formSubmitting && closeForm()}
								/>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{commentEditTarget ? (
				<div
					className={styles.modalBackdrop}
					role="presentation"
					onClick={(e) => {
						if (e.target === e.currentTarget && !commentEditSubmitting) closeCommentEdit();
					}}
				>
					<div className={styles.modalDialog} role="dialog" aria-modal="true" aria-labelledby="comment-edit-title">
						<div className={styles.modalContent}>
							<div className={styles.modalHeader}>
								<h2 id="comment-edit-title" className={styles.modalTitle}>
									Modifier le commentaire
								</h2>
								<button
									type="button"
									className={styles.modalClose}
									onClick={() => !commentEditSubmitting && closeCommentEdit()}
									aria-label="Fermer"
								>
									×
								</button>
							</div>
							<div className={styles.modalBody}>
								<p className="small text-secondary mb-2">
									Article : <strong>{commentEditTarget.articleTitle}</strong> · Auteur :{' '}
									<strong>{commentEditTarget.authorUsername}</strong>
								</p>
								{error && commentEditTarget ? (
									<div className="alert alert-danger py-2 small mb-3" role="alert">
										{error}
									</div>
								) : null}
								<label className="form-label small fw-semibold" htmlFor="comment-edit-textarea">
									Texte du commentaire
								</label>
								<textarea
									id="comment-edit-textarea"
									className="form-control"
									rows={6}
									value={commentEditText}
									onChange={(e) => setCommentEditText(e.target.value)}
									disabled={commentEditSubmitting}
								/>
							</div>
							<div className={styles.modalFooter}>
								<button
									type="button"
									className="btn btn-outline-secondary"
									disabled={commentEditSubmitting}
									onClick={() => closeCommentEdit()}
								>
									Annuler
								</button>
								<button
									type="button"
									className={styles.btnPrimary}
									style={{ border: 'none' }}
									disabled={commentEditSubmitting}
									onClick={() => void handleCommentEditSave()}
								>
									{commentEditSubmitting ? 'Enregistrement…' : 'Enregistrer'}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{deleteTarget ? (
				<div
					className={styles.modalBackdrop}
					role="presentation"
					onClick={(e) => {
						if (e.target === e.currentTarget && !deleteSubmitting) setDeleteTarget(null);
					}}
				>
					<div className={styles.modalDialog} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
						<div className={styles.modalContent}>
							<div className={styles.modalHeader}>
								<h2 id="delete-dialog-title" className={styles.modalTitle}>
									Delete article?
								</h2>
								<button
									type="button"
									className={styles.modalClose}
									onClick={() => !deleteSubmitting && setDeleteTarget(null)}
									aria-label="Close"
								>
									×
								</button>
							</div>
							<div className={styles.modalBody}>
								<p className="mb-0">
									Delete <strong>{deleteTarget.title}</strong>? It will disappear from the public blog, but you can restore it from
									this dashboard later.
								</p>
								{error ? (
									<p className="text-danger small mt-2 mb-0" role="alert">
										{error}
									</p>
								) : null}
							</div>
							<div className={styles.modalFooter}>
								<button type="button" className="btn btn-outline-secondary" onClick={() => !deleteSubmitting && setDeleteTarget(null)}>
									Cancel
								</button>
								<button
									type="button"
									className="btn text-white fw-semibold"
									style={{ backgroundColor: '#b00020', borderColor: '#b00020' }}
									disabled={deleteSubmitting}
									onClick={confirmDelete}
								>
									{deleteSubmitting ? 'Deleting…' : 'Delete'}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
