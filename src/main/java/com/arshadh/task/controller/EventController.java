package com.arshadh.task.controller;

import com.arshadh.task.dto.ApiResponse;
import com.arshadh.task.dto.EventRequest;
import com.arshadh.task.dto.EventResponseDto;
import com.arshadh.task.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponseDto>> getAllEvents(
            @RequestParam(value = "userId", required = false) Long userId) {
        List<EventResponseDto> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    @PostMapping("/events")
    public ResponseEntity<ApiResponse> saveEvent(@Valid @RequestBody EventRequest request) {
        ApiResponse response = eventService.saveEvent(request);
        if (request.getId() == null || request.getId() == 0) {
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } else {
            return ResponseEntity.ok(response);
        }
    }

    @DeleteMapping("/events")
    public ResponseEntity<ApiResponse> deleteEvent(
            @RequestParam("id") Long id,
            @RequestParam(value = "userId", required = false) Long userId) {
        ApiResponse response = eventService.deleteEvent(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/events/{id}/status")
    public ResponseEntity<ApiResponse> updateEventStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status,
            @RequestParam(value = "date", required = false) String date) {
        ApiResponse response = eventService.updateEventStatus(id, status, date);
        return ResponseEntity.ok(response);
    }
}
