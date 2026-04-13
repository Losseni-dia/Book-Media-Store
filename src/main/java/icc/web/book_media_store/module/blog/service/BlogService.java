package icc.web.book_media_store.module.blog.service;

import icc.web.book_media_store.module.blog.dto.ArticleRequest;
import icc.web.book_media_store.module.blog.dto.ArticleResponse;
import icc.web.book_media_store.module.blog.dto.CommentModerationRequest;
import icc.web.book_media_store.module.blog.dto.CommentModerationResponse;
import icc.web.book_media_store.module.blog.dto.CommentRequest;
import icc.web.book_media_store.module.blog.dto.CommentResponse;
import icc.web.book_media_store.module.blog.dto.mapper.BlogMapper;
import icc.web.book_media_store.module.blog.model.Article;
import icc.web.book_media_store.module.blog.model.Comment;
import icc.web.book_media_store.module.blog.model.CommentStatus;
import icc.web.book_media_store.module.blog.repository.ArticleRepository;
import icc.web.book_media_store.module.blog.repository.CommentRepository;
import icc.web.book_media_store.module.user.model.role.RoleName;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class BlogService {

	private static final int DUMMY_ARTICLE_TARGET_TOTAL = 100;

	/** Realistic titles: books, technology, and hi-fi (random picks for bulk seed rows). */
	private static final List<String> DUMMY_TITLE_POOL = List.of(
			"The Evolution of Noise-Canceling Headphones",
			"Top 10 Sci-Fi Books of the Decade",
			"Understanding React Hooks in Production Apps",
			"Vinyl vs Digital: The Ultimate Audio Showdown",
			"Building REST APIs with Spring Boot and OpenAPI",
			"How to Choose Your First Turntable Without Regrets",
			"Reading Lists for Long Winter Evenings",
			"OLED vs Mini-LED: What Home Theater Buyers Should Know",
			"TypeScript Patterns for Large Front-End Codebases",
			"The Quiet Revolution in Nearfield Studio Monitors",
			"Forgotten Classics: Science Fiction Before 1980",
			"Mechanical Keyboards: Sound, Feel, and Sustainability",
			"Streaming Hi-Res Audio Without Dropouts or Glitches",
			"Bookbinding and the Comeback of Small Press Editions",
			"Smart Speakers and Privacy: A Practical Household Guide",
			"GraphQL vs REST for a Modern Bookstore API");

	/** Rich paragraphs combined randomly into article bodies. */
	private static final List<String> DUMMY_BODY_PARAGRAPH_POOL = List.of(
			"Audiophiles once chased raw specs; today they chase believable staging, low noise floors, and gear that "
					+ "disappears into the music. Whether you listen on headphones or full-range towers, the goal is the "
					+ "same: trust what you hear on Tuesday night after a long day, not only on demo tracks in a bright showroom.",
			"Books are time machines bound in paper or pixels. A great novel does not explain the world—it rearranges your "
					+ "attention until familiar streets feel uncanny. That is why annual “best of” lists matter less than the "
					+ "slow work of building a personal canon you will still defend five years from now.",
			"Modern web stacks reward small, composable units of state. Hooks are not magic; they are contracts between "
					+ "render cycles and side effects. Teams that document those contracts—what runs when, what cancels on "
					+ "unmount—ship fewer regressions when routes grow and data fetching splinters across features.",
			"Spring Boot turns opinionated defaults into speed, but production is where opinions meet reality: thread pools, "
					+ "health checks, idempotent retries, and logs you can search when a customer says “it failed around 14:10.” "
					+ "Treat operations as part of the feature, not a postscript.",
			"Vinyl is not about nostalgia alone; it is about pacing. Side A ends, you stand, flip the record, and the room "
					+ "resets. In a playlist culture, that friction can be a feature—if your setup is quiet enough to reward it.",
			"Hi-fi shopping is full of acronyms and tribalism. Start with your room: dimensions, reflections, and where you "
					+ "actually sit. Speakers and headphones interact with space more than with marketing claims. Measure a little, "
					+ "listen a lot, and upgrade where the bottleneck really is.");

	/** Cover images: books, tech, headphones, vinyl, speakers, reading, workspace. */
	private static final List<String> DUMMY_IMAGE_POOL = List.of(
			"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1545127398-f3a9a1a51aea?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80");

	private final ArticleRepository articleRepository;
	private final CommentRepository commentRepository;
	private final BlogMapper blogMapper;

	/** Public blog listing: active and not soft-deleted. */
	public List<ArticleResponse> getArticles(String search) {
		List<Article> articles = (search != null && !search.isBlank())
				? articleRepository.findByTitleContainingIgnoreCaseAndDeletedFalseAndActiveTrue(search)
				: articleRepository.findAllByDeletedFalseAndActiveTrue();
		return articles.stream().map(blogMapper::toArticleResponse).toList();
	}

	/**
	 * Admin dashboard: all articles, including soft-deleted, so they can be restored.
	 * Newest updates first.
	 */
	public List<ArticleResponse> getArticlesForAdmin() {
		return articleRepository.findAllByOrderByUpdatedAtDesc().stream()
				.map(blogMapper::toArticleResponse)
				.toList();
	}

	public ArticleResponse getArticleById(Long id) {
		Article article = articleRepository.findByIdAndDeletedFalseAndActiveTrue(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		return blogMapper.toArticleResponse(article);
	}

	public List<CommentResponse> getComments(Long articleId) {
		if (!articleRepository.existsByIdAndDeletedFalseAndActiveTrue(articleId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found");
		}
		return commentRepository
				.findByArticle_IdAndStatusOrderByCreatedAtDesc(articleId, CommentStatus.APPROVED)
				.stream()
				.map(blogMapper::toCommentResponse)
				.toList();
	}

	public CommentResponse addComment(Long articleId, CommentRequest request) {
		Article article = articleRepository.findByIdAndDeletedFalseAndActiveTrue(articleId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !auth.isAuthenticated()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}
		String principal = auth.getName();
		if (principal == null || principal.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}
		Comment comment = Comment.builder()
				.content(request.content())
				.authorUsername(principal)
				.article(article)
				.status(CommentStatus.PENDING)
				.build();
		Comment saved = commentRepository.save(comment);
		return blogMapper.toCommentResponse(saved);
	}

	public List<CommentModerationResponse> listPendingComments() {
		return commentRepository.findByStatusWithArticleOrderByCreatedAtDesc(CommentStatus.PENDING).stream()
				.map(blogMapper::toCommentModerationResponse)
				.toList();
	}

	/** Five most recent blog comments whose authors are not ADMIN users (moderation snapshot). */
	public List<CommentModerationResponse> listFiveMostRecentCommentsFromNonAdminUsers() {
		return commentRepository
				.findRecentCommentsFromNonAdminUsers(RoleName.ADMIN, PageRequest.of(0, 5))
				.stream()
				.map(blogMapper::toCommentModerationResponse)
				.toList();
	}

	public CommentModerationResponse moderateComment(Long commentId, CommentModerationRequest request) {
		CommentStatus target = request.status();
		if (target != CommentStatus.APPROVED && target != CommentStatus.REJECTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only APPROVED or REJECTED are allowed");
		}
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
		comment.setStatus(target);
		Comment saved = commentRepository.save(comment);
		return blogMapper.toCommentModerationResponse(saved);
	}

	/** Admin: rewrite comment body (status and author unchanged). */
	public CommentModerationResponse updateCommentContent(Long commentId, CommentRequest request) {
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
		comment.setContent(request.content());
		Comment saved = commentRepository.save(comment);
		return blogMapper.toCommentModerationResponse(saved);
	}

	public ArticleResponse createArticle(ArticleRequest request) {
		Article entity = blogMapper.toArticle(request);
		Article saved = articleRepository.save(entity);
		return blogMapper.toArticleResponse(saved);
	}

	public ArticleResponse updateArticle(Long id, ArticleRequest request) {
		Article article = articleRepository.findByIdAndDeletedFalse(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		article.setTitle(request.title());
		article.setContent(request.content());
		article.setImageUrl(request.imageUrl());
		return blogMapper.toArticleResponse(articleRepository.save(article));
	}

	/** Soft delete: {@code deleted = true} (persisted as 1 in MySQL). */
	public void softDelete(Long id) {
		Article article = articleRepository.findByIdAndDeletedFalse(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		article.setDeleted(true);
		articleRepository.save(article);
	}

	/** Undo soft delete: {@code deleted = false}, {@code active = true}. */
	public ArticleResponse restoreArticle(Long id) {
		Article article = articleRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		if (!article.isDeleted()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is not deleted");
		}
		article.setDeleted(false);
		article.setActive(true);
		return blogMapper.toArticleResponse(articleRepository.save(article));
	}

	public ArticleResponse toggleStatus(Long id) {
		Article article = articleRepository.findByIdAndDeletedFalse(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		article.setActive(!article.isActive());
		return blogMapper.toArticleResponse(articleRepository.save(article));
	}

	public ArticleResponse likeArticle(Long id) {
		Article article = articleRepository.findByIdAndDeletedFalseAndActiveTrue(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		article.setLikes(article.getLikes() + 1);
		return blogMapper.toArticleResponse(articleRepository.save(article));
	}

	public ArticleResponse dislikeArticle(Long id) {
		Article article = articleRepository.findByIdAndDeletedFalseAndActiveTrue(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
		article.setDislikes(article.getDislikes() + 1);
		return blogMapper.toArticleResponse(articleRepository.save(article));
	}

	/** Stacks 2–4 random paragraphs for a varied, realistic article body. */
	private static String composeRandomArticleBody(Random random, List<String> paragraphs) {
		int count = 2 + random.nextInt(3);
		StringBuilder sb = new StringBuilder();
		for (int p = 0; p < count; p++) {
			if (p > 0) {
				sb.append("\n\n");
			}
			sb.append(paragraphs.get(random.nextInt(paragraphs.size())));
		}
		return sb.toString();
	}

	public String initializeDummyData() {
		if (articleRepository.count() != 0) {
			return "Database already contains data.";
		}

		ThreadLocalRandom rnd = ThreadLocalRandom.current();

		/* Curated articles (high quality) + generated rows => exactly DUMMY_ARTICLE_TARGET_TOTAL. */
		record Seed(String title, String content, String imageUrl) {
		}

		List<Seed> seeds = List.of(
				new Seed(
						"The Future of AI",
						"Artificial intelligence is reshaping how we build software, discover drugs, and create media. "
								+ "This article surveys the latest trends—from smaller efficient models to responsible deployment—and what they mean for teams shipping products in 2026.",
						"https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Best Books of 2026",
						"Our editors read hundreds of titles to bring you the standouts: literary fiction that lingers, "
								+ "thrillers that refuse to let go, and nonfiction that clarifies a noisy world. Here are the books worth your shelf space this year.",
						"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Mastering React Hooks",
						"Hooks changed how we share stateful logic in React. We walk through useState, useEffect, useMemo, and custom hooks with patterns that scale—"
								+ "including how to avoid stale closures and keep renders predictable.",
						"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Travel Guide to Tokyo",
						"From neon-lit Shibuya to quiet temple mornings in Asakusa, Tokyo rewards curiosity. "
								+ "We cover transit passes, neighborhood food crawls, day trips, and etiquette tips so your first—or fifth—visit feels effortless.",
						"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Weekend Hikes Near Brussels",
						"Belgium’s Ardennes and green belts around Brussels offer surprisingly rugged trails. "
								+ "Pack layers, download offline maps, and try these five loops—from family-friendly to full-day ridge walks.",
						"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Spring Boot in Production",
						"Moving from demo to production means health checks, structured logging, graceful shutdown, and sane defaults for connection pools. "
								+ "Here is a concise checklist we use before every release.",
						"https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Vinyl Comeback: Why Analog Matters",
						"Streaming is infinite, but vinyl puts albums back in sequence—with artwork you can hold. "
								+ "We talk pressings, turntable setup, and why younger listeners are filling crates again.",
						"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Marathon Training for Beginners",
						"You do not need to run every day to finish your first 42 km. "
								+ "Build volume slowly, prioritize sleep, and learn pacing—this plan gets you from couch to start line in six months.",
						"https://images.unsplash.com/photo-1476480862126-115bf34a168c?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Space Exploration in the 2020s",
						"Reusable rockets, lunar gateways, and Mars sample return are no longer slide-deck fantasies. "
								+ "We summarize the missions on the calendar and the science each one unlocks.",
						"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"),
				new Seed(
						"Farm-to-Table Cooking at Home",
						"Shorten the path from soil to skillet: shop seasonally, prep once for the week, and let simple techniques—roasting, braising, quick pickles—"
								+ "make vegetables the star without restaurant gear.",
						"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80"));

		List<Article> built = new ArrayList<>();
		for (Seed s : seeds) {
			built.add(Article.builder()
					.title(s.title())
					.content(s.content())
					.imageUrl(s.imageUrl())
					.likes(rnd.nextInt(10, 101))
					.dislikes(rnd.nextInt(0, 11))
					.build());
		}

		Article first = articleRepository.save(built.get(0));
		Article second = articleRepository.save(built.get(1));
		for (int i = 2; i < built.size(); i++) {
			articleRepository.save(built.get(i));
		}

		commentRepository.save(Comment.builder()
				.content("This is exactly the overview I needed—clear and forward-looking.")
				.authorUsername("alex")
				.article(first)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("Any recommended reading for ethics in deployed models?")
				.authorUsername("sam")
				.article(first)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("Loved the section on smaller models. More teams should try distillation first.")
				.authorUsername("maria")
				.article(first)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("Saving this for our next guild meeting. Thanks!")
				.authorUsername("user")
				.article(first)
				.status(CommentStatus.APPROVED)
				.build());

		commentRepository.save(Comment.builder()
				.content("Already ordered three from your fiction list. Impossible to choose just one.")
				.authorUsername("jordan")
				.article(second)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("Would love a follow-up on translated works this year.")
				.authorUsername("taylor")
				.article(second)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("The thriller picks are spot on—finished two in a weekend.")
				.authorUsername("casey")
				.article(second)
				.status(CommentStatus.APPROVED)
				.build());
		commentRepository.save(Comment.builder()
				.content("Great balance between buzzy releases and quieter gems.")
				.authorUsername("riley")
				.article(second)
				.status(CommentStatus.APPROVED)
				.build());

		int curatedCount = built.size();
		int generatedCount = DUMMY_ARTICLE_TARGET_TOTAL - curatedCount;
		Random articleRandom = new Random();
		for (int i = 0; i < generatedCount; i++) {
			String title = DUMMY_TITLE_POOL.get(articleRandom.nextInt(DUMMY_TITLE_POOL.size()));
			String content = composeRandomArticleBody(articleRandom, DUMMY_BODY_PARAGRAPH_POOL);
			String imageUrl = DUMMY_IMAGE_POOL.get(articleRandom.nextInt(DUMMY_IMAGE_POOL.size()));
			articleRepository.save(Article.builder()
					.title(title)
					.content(content)
					.imageUrl(imageUrl)
					.likes(articleRandom.nextInt(151))
					.dislikes(articleRandom.nextInt(21))
					.build());
		}

		return "Database initialized with dummy data.";
	}
}
