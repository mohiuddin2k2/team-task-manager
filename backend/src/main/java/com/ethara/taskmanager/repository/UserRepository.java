package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findTop10ByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(String email, String name);
}
