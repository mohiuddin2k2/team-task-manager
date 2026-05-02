package com.ethara.taskmanager.controller;

import com.ethara.taskmanager.dto.dashboard.DashboardResponse;
import com.ethara.taskmanager.service.DashboardService;
import com.ethara.taskmanager.service.UserContextService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserContextService userContextService;

    public DashboardController(DashboardService dashboardService, UserContextService userContextService) {
        this.dashboardService = dashboardService;
        this.userContextService = userContextService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardResponse> getDashboardOverview(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getDashboard(userContextService.getCurrentUser(authentication)));
    }
}
