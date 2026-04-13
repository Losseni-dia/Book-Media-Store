package icc.web.book_media_store.module.blog.dto;

import icc.web.book_media_store.module.blog.model.CommentStatus;
import jakarta.validation.constraints.NotNull;

public record CommentModerationRequest(@NotNull CommentStatus status) {
}
