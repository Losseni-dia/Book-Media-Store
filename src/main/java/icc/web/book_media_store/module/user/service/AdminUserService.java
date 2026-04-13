package icc.web.book_media_store.module.user.service;

import icc.web.book_media_store.infrastructure.error.BusinessException;
import icc.web.book_media_store.infrastructure.error.ErrorCode;
import icc.web.book_media_store.module.user.dto.AdminUserResponse;
import icc.web.book_media_store.module.user.model.User;
import icc.web.book_media_store.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        user.setActive(!user.isActive());
        return toResponse(userRepository.save(user));
    }

    private AdminUserResponse toResponse(User user) {
            // On doit passer par role.getName() (ton Enum) puis .name()
            String roles = user.getRoles().stream()
                            .map(role -> String.valueOf(role.getName()))
                            .collect(Collectors.joining(", "));

            return new AdminUserResponse(
                            user.getId(),
                            user.getFirstName(),
                            user.getLastName(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getBirthDate(),
                            user.getAddress(),
                            user.getPostalCode(),
                            user.getPhone(),
                            user.getAvatarUrl(),
                            roles,
                            user.isActive(),
                            user.getCreatedAt(),
                            user.getUpdatedAt());
    }
}