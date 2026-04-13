package icc.web.book_media_store.module.blog.dto;

import icc.web.book_media_store.module.blog.model.CommentStatus;
import java.time.LocalDateTime;

public record CommentModerationResponse(
		Long id,
		Long articleId,
		String articleTitle,
		String content,
		String authorUsername,
		LocalDateTime createdAt,
		CommentStatus status) {
}
