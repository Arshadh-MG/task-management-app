package com.arshadh.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @JsonProperty("fullName")
    private String fullName;

    @NotBlank(message = "Email is required")
    @JsonProperty("email")
    private String email;

    @NotBlank(message = "Role is required")
    @JsonProperty("role")
    private String role;

    @NotBlank(message = "Password is required")
    @Size(min = 4, message = "Password must have at least 4 characters")
    @JsonProperty("password")
    private String password;

    public RegisterRequest() {
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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
