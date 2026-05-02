package com.ethara.taskmanager.dto.collaboration;

import com.ethara.taskmanager.entity.Role;
import java.time.LocalDateTime;

public record DirectMessageResponse(
    Long id,
    Long senderId,
    String senderName,
    Role senderRole,
    Long recipientId,
    String recipientName,
    String content,
    LocalDateTime createdAt
) {
}
