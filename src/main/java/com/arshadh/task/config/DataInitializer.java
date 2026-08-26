package com.arshadh.task.config;

import com.arshadh.task.entity.Product;
import com.arshadh.task.entity.User;
import com.arshadh.task.repository.ProductRepository;
import com.arshadh.task.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordUtil passwordUtil;

    public DataInitializer(UserRepository userRepository, ProductRepository productRepository, PasswordUtil passwordUtil) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
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

        if (productRepository.count() == 0) {
            productRepository.save(new Product("Product A"));
            productRepository.save(new Product("Product B"));
            productRepository.save(new Product("Product C"));
            System.out.println("Default products seeded: Product A, Product B, Product C");
        }
    }
}
