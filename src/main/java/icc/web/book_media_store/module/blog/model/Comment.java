package icc.web.book_media_store.module.blog.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(nullable = false)
	private String authorUsername;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "article_id", nullable = false)
	private Article article;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@Builder.Default
	private CommentStatus status = CommentStatus.PENDING;

	@PrePersist
	protected void onCreate() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}
}
