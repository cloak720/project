// src/main/java/com/marian/project/service/ReportService.java
package com.marian.project.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReportService {

    public Map<String, Object> generateSummaryReport() {
        // Replace with your actual logic. This is dummy data.
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers", 100);
        summary.put("totalOpportunities", 50);
        summary.put("pendingRequests", 5);
        summary.put("acceptedRequests", 10);
        summary.put("totalVolunteers", 20);
        return summary;
    }
}
