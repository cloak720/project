package com.marian.project.service;

import com.marian.project.model.User;
import com.marian.project.repository.UserRepository;
import java.util.Optional;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

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
        return userRepository.save(user);
    }

    public boolean checkPassword(String rawPassword, String storedPassword) {
        return rawPassword != null && rawPassword.equals(storedPassword);
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

    // Updated authenticate method with banned user check
    public User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            // Check if the user is banned
            if (Boolean.TRUE.equals(user.getBanned())) {
                throw new RuntimeException("User is banned");
            }
            if (checkPassword(rawPassword, user.getPassword())) {
                return user;
            } else {
                System.out.println("Password mismatch!");
            }
        }
        return null;
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
        existingUser.setRole(user.getRole());
        // Optionally, you can update the banned status here if needed.
        return userRepository.save(existingUser);
    }

    // Retrieve all users (for admin use)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User registerUser(User user) {
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
