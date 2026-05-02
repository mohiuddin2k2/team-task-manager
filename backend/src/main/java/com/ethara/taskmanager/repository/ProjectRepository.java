package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.entity.Project;
import com.ethara.taskmanager.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
        select distinct p from Project p
        left join p.members m
        where p.owner = :user or m.user = :user
        order by p.createdAt desc
        """)
    List<Project> findAccessibleProjects(User user);
}
