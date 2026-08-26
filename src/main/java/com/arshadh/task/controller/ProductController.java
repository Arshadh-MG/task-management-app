package com.arshadh.task.controller;

import com.arshadh.task.dto.ApiResponse;
import com.arshadh.task.entity.Product;
import com.arshadh.task.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse> saveProduct(@RequestBody Product product) {
        ApiResponse response = productService.saveProduct(product);
        if (product.getId() == null || product.getId() == 0) {
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } else {
            return ResponseEntity.ok(response);
        }
    }

    @DeleteMapping("/products")
    public ResponseEntity<ApiResponse> deleteProduct(@RequestParam("id") Long id) {
        ApiResponse response = productService.deleteProduct(id);
        return ResponseEntity.ok(response);
    }
}
