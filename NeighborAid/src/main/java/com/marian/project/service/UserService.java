package com.marian.project.service;

import com.marian.project.model.Request;
import com.marian.project.model.User;
import com.marian.project.repository.ContactMessageRepository;
import com.marian.project.repository.FeedbackRepository;
import com.marian.project.repository.RequestRepository;
import com.marian.project.repository.UserRepository;
import com.marian.project.repository.VolunteerRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder(12);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Transactional
    public User saveUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        if (!isValidRole(user.getRole())) {
            throw new IllegalArgumentException("Invalid role.");
        }
        if (isEmailRegistered(user.getEmail())) {
            throw new IllegalArgumentException("Email already registered.");
        }
        user.setPassword(hashPassword(user.getPassword()));
        return userRepository.save(user);
    }

    /** New passwords are stored as salted BCrypt hashes (cost 12). */
    public static String hashPassword(String rawPassword) {
        return rawPassword == null ? null : BCRYPT.encode(rawPassword);
    }

    static boolean isBcrypt(String stored) {
        return stored != null && stored.length() == 60 && stored.startsWith("$2");
    }

    /** Hex SHA-256: how accounts created by the original version of the app were stored. */
    static String legacySha256(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    /**
     * True when the password matches. Accepts BCrypt, plus the two legacy formats
     * (unsalted SHA-256 and plain text) so existing accounts can still log in; those
     * are re-hashed with BCrypt on their next successful login (see authenticate).
     */
    public boolean checkPassword(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (isBcrypt(storedPassword)) {
            return BCRYPT.matches(rawPassword, storedPassword);
        }
        return legacySha256(rawPassword).equalsIgnoreCase(storedPassword) || rawPassword.equals(storedPassword);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean isEmailRegistered(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found for ID: " + id));
    }

    private boolean isValidRole(Integer role) {
        return role != null && (role == 0 || role == 1 || role == 2);
    }

    /**
     * Returns the user when the email and password match, null otherwise.
     * The password is checked before the ban, so a wrong password never reveals
     * whether an account exists or is suspended.
     */
    @Transactional
    public User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !checkPassword(rawPassword, user.getPassword())) {
            return null;
        }
        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new IllegalStateException("User is banned");
        }
        if (!isBcrypt(user.getPassword())) {
            user.setPassword(hashPassword(rawPassword));
            userRepository.save(user);
            log.info("Upgraded password hash to BCrypt for user {}", user.getId());
        }
        return user;
    }

    @Transactional
    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found for ID: " + id));
        existingUser.setFirstName(user.getFirstName());
        existingUser.setLastName(user.getLastName());
        existingUser.setPhoneNo(user.getPhoneNo());
        existingUser.setAge(user.getAge());
        existingUser.setHouseNo(user.getHouseNo());
        existingUser.setEmail(user.getEmail());
        // Role and banned status are deliberately NOT copied from the request body:
        // otherwise anyone could promote themselves to admin from the profile form.
        return userRepository.save(existingUser);
    }

    /**
     * Deletes an account without leaving broken references behind: the user's own requests and
     * opportunity sign-ups go with them, and requests they had accepted as a volunteer go back to PENDING
     * so another volunteer can pick them up.
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        if (user.getRole() != null && user.getRole() == 0) {
            throw new RuntimeException("Admin accounts can't be deleted from the dashboard.");
        }
        for (Request r : requestRepository.findByVolunteerId(id)) {
            r.setVolunteer(null);
            if (!"COMPLETED".equalsIgnoreCase(r.getStatus())) {
                r.setStatus("PENDING");
            }
            requestRepository.save(r);
        }
        requestRepository.deleteAll(requestRepository.findByUserId(id));
        volunteerRepository.deleteAll(volunteerRepository.findByUserId(id));
        // Ratings they gave or received, and messages they sent us, go too.
        feedbackRepository.deleteAll(feedbackRepository.findByUserId(id));
        feedbackRepository.deleteAll(feedbackRepository.findByVolunteerId(id));
        if (user.getEmail() != null) {
            contactMessageRepository.deleteAll(contactMessageRepository.findByEmailIgnoreCase(user.getEmail()));
        }
        userRepository.delete(user);
    }

    // Retrieve all users (for admin use)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User registerUser(User user) {
        user.setPassword(hashPassword(user.getPassword()));
        return userRepository.save(user);
    }

    // Ban a user (admin-only functionality)
    @Transactional
    public User banUser(Long id) {
        User userToBan = getUserById(id);
        // Prevent banning an admin (role 0)
        if (userToBan.getRole() != null && userToBan.getRole() == 0) {
            throw new RuntimeException("Cannot ban an admin user.");
        }
        userToBan.setBanned(true);
        return userRepository.save(userToBan);
    }

    // Unban a user (admin-only functionality)
    @Transactional
    public User unbanUser(Long id) {
        User userToUnban = getUserById(id);
        userToUnban.setBanned(false);
        return userRepository.save(userToUnban);
    }
}
