package com.ethara.taskmanager.service;

import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.exception.ApiException;
import com.ethara.taskmanager.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class UserContextService {

    private final UserRepository userRepository;

    public UserContextService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Current user not found"));
    }
}
