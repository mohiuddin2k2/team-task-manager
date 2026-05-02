package com.ethara.taskmanager.dto.collaboration;

import com.ethara.taskmanager.entity.Role;
import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    Long senderId,
    String senderName,
    Role senderRole,
    String content,
    LocalDateTime createdAt
) {
}
