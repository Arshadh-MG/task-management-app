package com.arshadh.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProfileUpdateRequest {

    @NotNull(message = "userId is required")
    @JsonProperty("userId")
    private Long userId;

    @NotBlank(message = "fullName is required")
    @JsonProperty("fullName")
    private String fullName;

    @NotBlank(message = "role is required")
    @JsonProperty("role")
    private String role;

    @JsonProperty("password")
    private String password;

    public ProfileUpdateRequest() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
