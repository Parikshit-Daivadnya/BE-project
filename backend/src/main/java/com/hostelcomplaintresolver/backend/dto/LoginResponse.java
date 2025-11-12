package com.hostelcomplaintresolver.backend.dto;

public class LoginResponse {

        private String token;


        // A no-argument constructor (good practice)
        public LoginResponse() {
        }

        // The constructor your code is looking for
        public LoginResponse(String token) {
            this.token = token;
        }

        // --- GETTER ---
        public String getToken() {
            return token;
        }

        // --- SETTER ---
        public void setToken(String token) {
            this.token = token;
        }
    }

