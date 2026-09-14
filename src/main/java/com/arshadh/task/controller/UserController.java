package com.arshadh.task.controller;

import com.arshadh.task.dto.ApiResponse;
import com.arshadh.task.dto.ProfileResponse;
import com.arshadh.task.dto.ProfileUpdateRequest;
import com.arshadh.task.dto.UserSummaryDto;
import com.arshadh.task.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(@RequestParam("userId") Long userId) {
        ProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        ApiResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        List<UserSummaryDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse> createUser(@Valid @RequestBody com.arshadh.task.dto.CreateUserDto request) {
        ApiResponse response = userService.createUser(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users")
    public ResponseEntity<ApiResponse> deleteUser(@RequestParam("id") Long id) {
        ApiResponse response = userService.deleteUser(id);
        return ResponseEntity.ok(response);
    }
}
