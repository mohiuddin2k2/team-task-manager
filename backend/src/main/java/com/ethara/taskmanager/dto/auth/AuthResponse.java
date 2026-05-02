package com.ethara.taskmanager.dto.auth;

import com.ethara.taskmanager.entity.Role;

public record AuthResponse(
    String token,
    Long id,
    String name,
    String email,
    Role role
) {
}
