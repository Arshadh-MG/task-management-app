package com.arshadh.task.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private String message;
    private String error;
    private Long id;

    public ApiResponse() {
    }

    public ApiResponse(String message) {
        this.message = message;
    }

    public static ApiResponse success(String message) {
        return new ApiResponse(message);
    }

    public static ApiResponse success(String message, Long id) {
        ApiResponse response = new ApiResponse(message);
        response.setId(id);
        return response;
    }

    public static ApiResponse error(String error) {
        ApiResponse response = new ApiResponse();
        response.setError(error);
        return response;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
