package icc.web.book_media_store.infrastructure.bootstrap;

import icc.web.book_media_store.module.user.model.User;
import icc.web.book_media_store.module.user.model.role.Role;
import icc.web.book_media_store.module.user.model.role.RoleName;
import icc.web.book_media_store.module.user.model.role.repository.RoleRepository;
import icc.web.book_media_store.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

/**
 * Ensures default {@link RoleName} rows exist and provisions a local admin account for testing the dashboard.
 */
@Component
@RequiredArgsConstructor
public class AdminUserBootstrap implements ApplicationRunner {

	private static final String ADMIN_EMAIL = "admin@admin.com";

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		Role adminRole = roleRepository.findByName(RoleName.ADMIN)
				.orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));
		roleRepository.findByName(RoleName.USER)
				.orElseGet(() -> roleRepository.save(new Role(RoleName.USER)));

		if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
			return;
		}

		User admin = User.builder()
				.firstName("Admin")
				.lastName("Bookea")
				.username("admin")
				.email(ADMIN_EMAIL)
				.password(passwordEncoder.encode("admin"))
				.birthDate(LocalDate.of(1990, 1, 1))
				.address("N/A")
				.postalCode("00000")
				.active(true)
				.roles(Set.of(adminRole))
				.build();
		userRepository.save(admin);
	}
}
