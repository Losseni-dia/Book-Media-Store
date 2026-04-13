package icc.web.book_media_store.infrastructure.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SpringSecurityConfig {

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                return http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable()) // Une seule fois suffit

                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/api/auth/**").permitAll()
                                                /* TEMP: remove after DB seeded — open blog dummy-data init in browser */
                                                .requestMatchers("/api/blog/init").permitAll()
                                                .requestMatchers("/api/chat/auth/**").permitAll()
                                                .requestMatchers("/api/user/register").permitAll()
                                                .requestMatchers("/ws-chat/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                /* Blog back-office (controller methods also use @PreAuthorize) */
                                                .requestMatchers("/api/blog/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/error").permitAll()
                                                
                                                .requestMatchers("/api/**").permitAll()
                                                .requestMatchers("/uploads/**").permitAll()

                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/blog/articles",
                                                                "/api/blog/articles/*",
                                                                "/api/blog/articles/*/comments",
                                                                "/api/blog/images/*")
                                                .permitAll()

                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/blog/articles/*/comments",
                                                                "/api/blog/*/like",
                                                                "/api/blog/*/dislike")
                                                .authenticated()

                                                .requestMatchers("/api/rooms/**").permitAll()

                                                .requestMatchers("/api/**").authenticated()

                                                .anyRequest().permitAll())

                                .formLogin(form -> form
                                                .loginProcessingUrl("/api/auth/login")
                                                .successHandler((req, res, auth) -> {
                                                        res.setStatus(HttpServletResponse.SC_OK);
                                                        res.setContentType("application/json");
                                                        res.getWriter().write(
                                                                        "{\"message\": \"Connexion réussie\", \"user\": \""
                                                                                        + auth.getName() + "\"}");
                                                })
                                                .failureHandler((req, res, exc) -> {
                                                        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        res.setContentType("application/json");
                                                        res.getWriter().write(
                                                                        "{\"error\": \"Identifiants invalides\"}");
                                                }))

                                .logout(logout -> logout
                                                .logoutUrl("/api/auth/logout")
                                                .logoutSuccessHandler((req, res, auth) -> res
                                                                .setStatus(HttpServletResponse.SC_OK))
                                                .invalidateHttpSession(true)
                                                .deleteCookies("JSESSIONID"))
                                .build();
        }

        /**
         * Origines CORS pour la chaîne de sécurité (front 3000, 3001, 3003).
         */
        private CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of(
                                "http://localhost:3000",
                                "http://localhost:3001",
                                "http://localhost:3003"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Requested-With"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(12);
        }
}