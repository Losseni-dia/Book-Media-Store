package icc.web.book_media_store.module.blog.controller;

import icc.web.book_media_store.module.blog.dto.ArticleRequest;
import icc.web.book_media_store.module.blog.dto.ArticleResponse;
import icc.web.book_media_store.module.blog.dto.CommentModerationRequest;
import icc.web.book_media_store.module.blog.dto.CommentModerationResponse;
import icc.web.book_media_store.module.blog.dto.CommentRequest;
import icc.web.book_media_store.module.blog.dto.CommentResponse;
import icc.web.book_media_store.module.blog.service.BlogService;
import icc.web.book_media_store.module.blog.service.ImageService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

	private final BlogService blogService;
	private final ImageService imageService;

	@PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('ADMIN')")
	public String uploadBlogImage(@RequestParam("file") MultipartFile file) {
		return imageService.saveImage(file);
	}

	@GetMapping("/images/{filename}")
	public ResponseEntity<Resource> getBlogImage(@PathVariable String filename) {
		Resource resource = imageService.loadImageAsResource(filename);
		return ResponseEntity.ok()
				.contentType(imageService.resolveContentType(filename, resource))
				.body(resource);
	}

	@GetMapping("/articles")
	public List<ArticleResponse> listArticles(@RequestParam(required = false) String search) {
		return blogService.getArticles(search);
	}

	@GetMapping("/admin/articles")
	@PreAuthorize("hasRole('ADMIN')")
	public List<ArticleResponse> listArticlesForAdmin() {
		return blogService.getArticlesForAdmin();
	}

	@PostMapping("/articles")
	@PreAuthorize("hasRole('ADMIN')")
	public ArticleResponse createArticle(@Valid @RequestBody ArticleRequest request) {
		return blogService.createArticle(request);
	}

	@PutMapping("/articles/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ArticleResponse updateArticle(@PathVariable Long id, @Valid @RequestBody ArticleRequest request) {
		return blogService.updateArticle(id, request);
	}

	@PutMapping("/admin/articles/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ArticleResponse updateArticleAdmin(@PathVariable Long id, @Valid @RequestBody ArticleRequest request) {
		return blogService.updateArticle(id, request);
	}

	@DeleteMapping("/articles/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteArticle(@PathVariable Long id) {
		blogService.softDelete(id);
	}

	@PutMapping("/articles/{id}/restore")
	@PreAuthorize("hasRole('ADMIN')")
	public ArticleResponse restoreArticle(@PathVariable Long id) {
		return blogService.restoreArticle(id);
	}

	@PatchMapping("/articles/{id}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public ArticleResponse toggleArticleStatus(@PathVariable Long id) {
		return blogService.toggleStatus(id);
	}

	@GetMapping("/articles/{id}")
	public ArticleResponse getArticle(@PathVariable Long id) {
		return blogService.getArticleById(id);
	}

	@GetMapping("/articles/{id}/comments")
	public List<CommentResponse> listComments(@PathVariable Long id) {
		return blogService.getComments(id);
	}

	@GetMapping("/admin/comments/pending")
	@PreAuthorize("hasRole('ADMIN')")
	public List<CommentModerationResponse> listPendingComments() {
		return blogService.listPendingComments();
	}

	@GetMapping("/admin/comments/recent-from-users")
	@PreAuthorize("hasRole('ADMIN')")
	public List<CommentModerationResponse> listRecentUserCommentsForModeration() {
		return blogService.listFiveMostRecentCommentsFromNonAdminUsers();
	}

	@PatchMapping("/admin/comments/{commentId}/moderation")
	@PreAuthorize("hasRole('ADMIN')")
	public CommentModerationResponse moderateComment(
			@PathVariable Long commentId, @Valid @RequestBody CommentModerationRequest request) {
		return blogService.moderateComment(commentId, request);
	}

	@PutMapping("/admin/comments/{commentId}")
	@PreAuthorize("hasRole('ADMIN')")
	public CommentModerationResponse updateCommentAdmin(
			@PathVariable Long commentId, @Valid @RequestBody CommentRequest request) {
		return blogService.updateCommentContent(commentId, request);
	}

	@PostMapping("/articles/{id}/comments")
	@PreAuthorize("isAuthenticated()")
	public CommentResponse createComment(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {
		return blogService.addComment(id, request);
	}

	@PostMapping("/{id}/like")
	@PreAuthorize("isAuthenticated()")
	public ArticleResponse likeArticle(@PathVariable Long id) {
		return blogService.likeArticle(id);
	}

	@PostMapping("/{id}/dislike")
	@PreAuthorize("isAuthenticated()")
	public ArticleResponse dislikeArticle(@PathVariable Long id) {
		return blogService.dislikeArticle(id);
	}

	@GetMapping("/init")
	// TEMP: re-enable after DB seeded — was: @PreAuthorize("hasRole('ADMIN')")
	// @PreAuthorize("hasRole('ADMIN')")
	public String initializeDummyData() {
		return blogService.initializeDummyData();
	}
}
