package com.ethara.taskmanager.dto.collaboration;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
    @NotBlank(message = "Comment text is required")
    String content
) {
}
