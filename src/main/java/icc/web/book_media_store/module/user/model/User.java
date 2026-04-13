package icc.web.book_media_store.module.user.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import icc.web.book_media_store.module.user.model.role.Role;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users") // "user" est un mot réservé dans beaucoup de BDD, "users" est plus sûr
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // Ajouté pour permettre l'utilisation de User.builder() dans le ChatService
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, length = 10)
    private String postalCode;

    @Column(nullable = false)
    private boolean active = true;

    private String phone;

    private String avatarUrl;

    // --- GESTION DES RÔLES ---
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_role", // Nom de ta table de liaison (link table)
            joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}