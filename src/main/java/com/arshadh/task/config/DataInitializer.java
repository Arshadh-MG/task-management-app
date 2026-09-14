package com.arshadh.task.config;

import com.arshadh.task.entity.Product;
import com.arshadh.task.entity.User;
import com.arshadh.task.repository.ProductRepository;
import com.arshadh.task.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordUtil passwordUtil;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, ProductRepository productRepository, PasswordUtil passwordUtil, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.passwordUtil = passwordUtil;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // Automatically ensure Neon/PostgreSQL database columns have proper nullability and types on startup
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN email DROP NOT NULL");
        } catch (Exception e) {
            System.out.println("Notice: users.email nullability alter: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE events ALTER COLUMN title TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE events ALTER COLUMN description TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE events ALTER COLUMN images TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE events ALTER COLUMN subject TYPE TEXT");
        } catch (Exception e) {
            System.out.println("Notice: events column types alter: " + e.getMessage());
        }

        // Create performance indexes if not exists
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_events_product_id ON events(product_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_events_member_id ON events(member_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_events_date_prod ON events(event_date, product_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
        } catch (Exception e) {
            System.out.println("Notice: index creation: " + e.getMessage());
        }

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
