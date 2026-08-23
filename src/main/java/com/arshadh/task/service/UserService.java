package com.arshadh.task.service;

import com.arshadh.task.config.PasswordUtil;
import com.arshadh.task.dto.*;
import com.arshadh.task.entity.User;
import com.arshadh.task.repository.EventRepository;
import com.arshadh.task.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final PasswordUtil passwordUtil;

    public UserService(UserRepository userRepository, EventRepository eventRepository, PasswordUtil passwordUtil) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.passwordUtil = passwordUtil;
    }

    public ApiResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered.");
        }

        User user = new User(
                request.getFullName().trim(),
                email,
                request.getRole().trim(),
                passwordUtil.hashPassword(request.getPassword())
        );

        userRepository.save(user);
        return ApiResponse.success("Registration successful.");
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordUtil.verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        LoginResponse.UserInfoDto userInfo = new LoginResponse.UserInfoDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse("Login successful.", userInfo);
    }

    public ApiResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This email is not registered."));

        user.setPasswordHash(passwordUtil.hashPassword(request.getPassword()));
        userRepository.save(user);

        return ApiResponse.success("Password updated successfully.");
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        return new ProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    public ApiResponse updateProfile(ProfileUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        user.setFullName(request.getFullName().trim());
        user.setRole(request.getRole().trim());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 4) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must have at least 4 characters.");
            }
            user.setPasswordHash(passwordUtil.hashPassword(request.getPassword()));
        }

        userRepository.save(user);
        return ApiResponse.success("Profile updated successfully.");
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAllByOrderByFullNameAsc().stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole()))
                .collect(Collectors.toList());
    }

    public ApiResponse deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        eventRepository.unassignMemberEvents(user);
        eventRepository.deleteAllByUser(user);
        userRepository.delete(user);

        return ApiResponse.success("User removed successfully.");
    }
}
