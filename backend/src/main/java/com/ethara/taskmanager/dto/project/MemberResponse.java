package com.ethara.taskmanager.dto.project;

import com.ethara.taskmanager.entity.Role;

public record MemberResponse(
    Long id,
    String name,
    String email,
    Role role
) {
}
