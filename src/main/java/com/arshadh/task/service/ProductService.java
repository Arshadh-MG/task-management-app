package com.arshadh.task.service;

import com.arshadh.task.dto.ApiResponse;
import com.arshadh.task.entity.Product;
import com.arshadh.task.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAllByOrderByNameAsc();
    }

    public ApiResponse saveProduct(Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name is required.");
        }

        String trimmedName = product.getName().trim();

        if (product.getId() != null && product.getId() > 0) {
            Product existing = productRepository.findById(product.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));

            if (!existing.getName().equalsIgnoreCase(trimmedName) && productRepository.existsByNameIgnoreCase(trimmedName)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name already exists.");
            }

            existing.setName(trimmedName);
            productRepository.save(existing);
            return ApiResponse.success("Product updated successfully.");
        } else {
            if (productRepository.existsByNameIgnoreCase(trimmedName)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name already exists.");
            }

            Product newProduct = new Product(trimmedName);
            Product saved = productRepository.save(newProduct);
            return ApiResponse.success("Product created successfully.", saved.getId());
        }
    }

    public ApiResponse deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found.");
        }
        productRepository.deleteById(id);
        return ApiResponse.success("Product deleted successfully.");
    }
}
