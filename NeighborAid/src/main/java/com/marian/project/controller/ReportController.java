// src/main/java/com/marian/project/controller/ReportController.java
package com.marian.project.controller;

import com.marian.project.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummaryReport() {
        return ResponseEntity.ok(reportService.generateSummaryReport());
    }
}
