package icc.web.book_media_store.module.user.dto.mapper;

import icc.web.book_media_store.module.user.dto.RegisterRequest;
import icc.web.book_media_store.module.user.dto.UserProfileResponse;
import icc.web.book_media_store.module.user.dto.UpdateProfileRequest;
import icc.web.book_media_store.module.user.model.User;
import icc.web.book_media_store.module.user.model.role.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    // --- ENTITY -> RESPONSE ---

    @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRoles")
    UserProfileResponse toResponse(User user);

    // --- REQUEST -> ENTITY (UPDATE) ---

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "roles", ignore = true) // On ne change pas les rôles via le profil utilisateur
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "username", ignore = true) // Le username est souvent fixe
    void updateAppUser(UpdateProfileRequest request, @MappingTarget User user);

    // --- REGISTER -> ENTITY ---

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "roles", ignore = true) // Géré manuellement dans le service ou via @Builder.Default
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "phone", ignore = true) 
    User toEntity(RegisterRequest request);

   
    /**
     * Transforme le Set d'entités Role en Set de Strings pour le DTO
     */
    @Named("mapRoles")
    default Set<String> mapRoles(Set<Role> roles) {
        if (roles == null) {
            return Collections.emptySet();
        }
        return roles.stream()
                .map(role -> String.valueOf(role.getName())) // role.getName() retourne un Enum, on le convertit en String
                .collect(Collectors.toSet());

    }
}