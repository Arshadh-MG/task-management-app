package com.arshadh.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProfileResponse {
    private Long id;

    @JsonProperty("full_name")
    private String fullName;

    private String email;
    private String role;

    @JsonProperty("created_at")
    private String createdAt;

    public ProfileResponse() {
    }

    public ProfileResponse(Long id, String fullName, String email, String role, String createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
