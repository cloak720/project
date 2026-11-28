package com.marian.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.marian.project.model.User;
import com.marian.project.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServicePasswordTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    UserService userService;

    private static User user(String storedPassword, boolean banned) {
        User u = new User();
        u.setId(42L);
        u.setEmail("priya@example.com");
        u.setPassword(storedPassword);
        u.setBanned(banned);
        u.setRole(1);
        return u;
    }

    @Test
    void newPasswordsAreSaltedBcrypt() {
        String a = UserService.hashPassword("correct horse 1!");
        String b = UserService.hashPassword("correct horse 1!");
        assertThat(a).startsWith("$2").hasSize(60);
        assertThat(a).isNotEqualTo(b); // salted: same password, different hash
        assertThat(userService.checkPassword("correct horse 1!", a)).isTrue();
        assertThat(userService.checkPassword("wrong horse 1!", a)).isFalse();
    }

    @Test
    void legacySha256AndPlainTextStillWork() {
        String legacy = UserService.legacySha256("Resident#123");
        assertThat(userService.checkPassword("Resident#123", legacy)).isTrue();
        assertThat(userService.checkPassword("Resident#123", legacy.toUpperCase())).isTrue();
        assertThat(userService.checkPassword("nope", legacy)).isFalse();
        assertThat(userService.checkPassword("plain-old", "plain-old")).isTrue();
        assertThat(userService.checkPassword(null, legacy)).isFalse();
        assertThat(userService.checkPassword("x", null)).isFalse();
    }

    @Test
    void successfulLegacyLoginUpgradesTheHashToBcrypt() {
        User u = user(UserService.legacySha256("Resident#123"), false);
        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        assertThat(userService.authenticate("priya@example.com", "Resident#123")).isSameAs(u);
        assertThat(u.getPassword()).startsWith("$2").hasSize(60);
        assertThat(userService.checkPassword("Resident#123", u.getPassword())).isTrue();
        verify(userRepository).save(u);
    }

    @Test
    void bcryptLoginDoesNotRehash() {
        User u = user(UserService.hashPassword("Resident#123"), false);
        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        assertThat(userService.authenticate("priya@example.com", "Resident#123")).isSameAs(u);
        verify(userRepository, never()).save(any());
    }

    @Test
    void wrongPasswordNeverRevealsABan() {
        User banned = user(UserService.hashPassword("Resident#123"), true);
        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(banned));

        // Wrong password: same answer as an unknown account, nothing about the ban.
        assertThat(userService.authenticate("priya@example.com", "guess")).isNull();
        // Right password: now, and only now, the ban is reported.
        assertThatThrownBy(() -> userService.authenticate("priya@example.com", "Resident#123"))
            .hasMessage("User is banned");
    }

    @Test
    void unknownEmailIsJustAFailedLogin() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());
        assertThat(userService.authenticate("nobody@example.com", "whatever")).isNull();
    }
}
