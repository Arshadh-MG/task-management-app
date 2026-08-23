package com.arshadh.task.config;

import com.arshadh.task.entity.User;
import com.arshadh.task.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordUtil passwordUtil;

    public DataInitializer(UserRepository userRepository, PasswordUtil passwordUtil) {
        this.userRepository = userRepository;
        this.passwordUtil = passwordUtil;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin123@gmail.com";
        if (userRepository.findByEmailIgnoreCase(adminEmail).isEmpty()) {
            User admin = new User(
                    "Admin",
                    adminEmail,
                    "Administrator",
                    passwordUtil.hashPassword("aithentchn")
            );
            userRepository.save(admin);
            System.out.println("Default Administrator account seeded: " + adminEmail);
        }
    }
}
