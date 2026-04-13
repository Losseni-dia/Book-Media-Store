package icc.web.book_media_store.module.blog.repository;

import icc.web.book_media_store.module.blog.model.Comment;
import icc.web.book_media_store.module.blog.model.CommentStatus;
import icc.web.book_media_store.module.user.model.role.RoleName;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

	List<Comment> findByArticle_IdAndStatusOrderByCreatedAtDesc(Long articleId, CommentStatus status);

	@Query("""
			SELECT c FROM Comment c JOIN FETCH c.article
			WHERE c.status = :status
			ORDER BY c.createdAt DESC
			""")
	List<Comment> findByStatusWithArticleOrderByCreatedAtDesc(@Param("status") CommentStatus status);

	@Query("""
			SELECT c FROM Comment c JOIN FETCH c.article
			WHERE NOT EXISTS (
				SELECT 1 FROM User u JOIN u.roles r
				WHERE u.username = c.authorUsername AND r.name = :adminRoleName
			)
			ORDER BY c.createdAt DESC
			""")
	List<Comment> findRecentCommentsFromNonAdminUsers(
			@Param("adminRoleName") RoleName adminRoleName, Pageable pageable);
}
