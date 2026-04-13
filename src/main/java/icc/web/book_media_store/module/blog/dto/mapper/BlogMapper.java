package icc.web.book_media_store.module.blog.dto.mapper;

import icc.web.book_media_store.module.blog.dto.ArticleRequest;
import icc.web.book_media_store.module.blog.dto.ArticleResponse;
import icc.web.book_media_store.module.blog.dto.CommentModerationResponse;
import icc.web.book_media_store.module.blog.dto.CommentResponse;
import icc.web.book_media_store.module.blog.model.Article;
import icc.web.book_media_store.module.blog.model.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BlogMapper {

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "comments", ignore = true)
	@Mapping(target = "likes", constant = "0")
	@Mapping(target = "dislikes", constant = "0")
	@Mapping(target = "active", constant = "true")
	@Mapping(target = "deleted", constant = "false")
	Article toArticle(ArticleRequest request);

	ArticleResponse toArticleResponse(Article article);

	CommentResponse toCommentResponse(Comment comment);

	@Mapping(source = "article.id", target = "articleId")
	@Mapping(source = "article.title", target = "articleTitle")
	CommentModerationResponse toCommentModerationResponse(Comment comment);
}
