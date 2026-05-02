package com.ethara.taskmanager.service;

import com.ethara.taskmanager.dto.auth.AuthRequest;
import com.ethara.taskmanager.dto.auth.AuthResponse;
import com.ethara.taskmanager.dto.auth.RegisterRequest;
import com.ethara.taskmanager.entity.User;
import com.ethara.taskmanager.exception.ApiException;
import com.ethara.taskmanager.repository.UserRepository;
import com.ethara.taskmanager.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        });

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        User savedUser = userRepository.save(user);

        return buildResponse(savedUser);
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password())
        );

        User user = userRepository.findByEmail(request.email().toLowerCase())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        return buildResponse(user);
    }

    public AuthResponse currentUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        org.springframework.security.core.userdetails.User principal =
            new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );

        return new AuthResponse(
            jwtService.generateToken(principal),
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }
}
