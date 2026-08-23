package com.arshadh.task.service;

import com.arshadh.task.dto.ApiResponse;
import com.arshadh.task.dto.EventRequest;
import com.arshadh.task.dto.EventResponseDto;
import com.arshadh.task.entity.Event;
import com.arshadh.task.entity.User;
import com.arshadh.task.repository.EventRepository;
import com.arshadh.task.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResponseDto> getAllEvents() {
        return eventRepository.findAllOrdered().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ApiResponse saveEvent(EventRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        User member = null;
        if (request.getMemberId() != null && request.getMemberId() > 0) {
            member = userRepository.findById(request.getMemberId()).orElse(null);
        }

        if (request.getId() != null && request.getId() > 0) {
            Event existing = eventRepository.findById(request.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found."));

            existing.setTitle(request.getTitle().trim());
            existing.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
            existing.setTokenId(request.getTokenId() != null ? request.getTokenId().trim() : null);
            existing.setSubject(request.getSubject() != null ? request.getSubject().trim() : null);
            existing.setMember(member);
            existing.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().trim() : "progress");
            existing.setEventDate(request.getEventDate().trim());
            existing.setStartTime(request.getStartTime() != null ? request.getStartTime().trim() : "");
            existing.setEndTime(request.getEndTime() != null ? request.getEndTime().trim() : "");
            existing.setColor(request.getColor() != null && !request.getColor().isBlank() ? request.getColor().trim() : "blue");
            existing.setImages(request.getImages());

            eventRepository.save(existing);
            return ApiResponse.success("Event updated successfully.");
        } else {
            Event event = new Event();
            event.setUser(user);
            event.setTitle(request.getTitle().trim());
            event.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
            event.setTokenId(request.getTokenId() != null ? request.getTokenId().trim() : null);
            event.setSubject(request.getSubject() != null ? request.getSubject().trim() : null);
            event.setMember(member);
            event.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().trim() : "progress");
            event.setEventDate(request.getEventDate().trim());
            event.setStartTime(request.getStartTime() != null ? request.getStartTime().trim() : "");
            event.setEndTime(request.getEndTime() != null ? request.getEndTime().trim() : "");
            event.setColor(request.getColor() != null && !request.getColor().isBlank() ? request.getColor().trim() : "blue");
            event.setImages(request.getImages());

            Event saved = eventRepository.save(event);
            return ApiResponse.success("Event created successfully.", saved.getId());
        }
    }

    public ApiResponse deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found.");
        }
        eventRepository.deleteById(id);
        return ApiResponse.success("Event deleted successfully.");
    }

    private EventResponseDto mapToDto(Event event) {
        EventResponseDto dto = new EventResponseDto();
        dto.setId(event.getId());
        dto.setUserId(event.getUser() != null ? event.getUser().getId() : null);
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setTokenId(event.getTokenId());
        dto.setSubject(event.getSubject());
        dto.setMemberId(event.getMember() != null ? event.getMember().getId() : null);
        dto.setStatus(event.getStatus());
        dto.setEventDate(event.getEventDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setColor(event.getColor());
        dto.setImages(event.getImages());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        return dto;
    }
}
