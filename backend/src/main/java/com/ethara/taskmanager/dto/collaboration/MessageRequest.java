package com.ethara.taskmanager.dto.collaboration;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
    @NotBlank(message = "Message text is required")
    String content
) {
}
