package com.ethara.taskmanager.dto.collaboration;

import com.ethara.taskmanager.entity.Role;
import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    String authorName,
    Role authorRole,
    String content,
    LocalDateTime createdAt
) {
}
