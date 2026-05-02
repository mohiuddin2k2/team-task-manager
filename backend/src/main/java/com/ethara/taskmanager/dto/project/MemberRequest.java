package com.ethara.taskmanager.dto.project;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MemberRequest(
    @Email(message = "Enter a valid email")
    @NotBlank(message = "Email is required")
    String email
) {
}
