package icc.web.book_media_store.module.user.model.role.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import icc.web.book_media_store.module.user.model.role.Role;
import icc.web.book_media_store.module.user.model.role.RoleName;



public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}