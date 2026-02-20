package com.hostelcomplaintresolver.backend.dto;

public class UpdateUserRequest {

        private String mobile;
        private String permanentAddress;
        private String parentMobile;

        // Getters and Setters
        public String getMobile() { return mobile; }
        public void setMobile(String mobile) { this.mobile = mobile; }

        public String getPermanentAddress() { return permanentAddress; }
        public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }

        public String getParentMobile() { return parentMobile; }
        public void setParentMobile(String parentMobile) { this.parentMobile = parentMobile; }
    }

