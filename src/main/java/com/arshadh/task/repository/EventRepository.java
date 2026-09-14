package com.arshadh.task.repository;

import com.arshadh.task.entity.Event;
import com.arshadh.task.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.user LEFT JOIN FETCH e.member LEFT JOIN FETCH e.product ORDER BY e.createdAt DESC, e.id DESC")
    List<Event> findAllOrdered();

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.user LEFT JOIN FETCH e.member LEFT JOIN FETCH e.product WHERE e.eventDate = :eventDate ORDER BY e.createdAt DESC, e.id DESC")
    List<Event> findByEventDate(@Param("eventDate") String eventDate);

    @Modifying
    @Query("UPDATE Event e SET e.member = NULL WHERE e.member = :member")
    void unassignMemberEvents(@Param("member") User member);

    @Modifying
    @Query("DELETE FROM Event e WHERE e.user = :user")
    void deleteAllByUser(@Param("user") User user);
}
