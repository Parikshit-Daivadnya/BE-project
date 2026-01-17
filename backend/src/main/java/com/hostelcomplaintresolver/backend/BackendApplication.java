package com.hostelcomplaintresolver.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication
@EnableJpaAuditing
// 👇 These lines explicitly tell Spring where to find your files
@EnableJpaRepositories(basePackages = "com.hostelcomplaintresolver.backend.repository")
@EntityScan(basePackages = "com.hostelcomplaintresolver.backend.model")
@EnableAsync
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}