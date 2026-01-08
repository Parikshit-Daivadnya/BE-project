package com.hostelcomplaintresolver.backend.dto;

import com.hostelcomplaintresolver.backend.model.Role;

public class CreateUserRequest {

    private String name;
    private String email;
    private String password;
    private Role role;
    private String mobile;
    private String permanentAddress;

    // Student Specific
    private String irn;
    private String roomNumber;
    private String hostelName;      // ✅ New
    private String course;          // ✅ New
    private String year;            // ✅ New
    private String department;      // ✅ New
    private String parentMobile;    // ✅ New

    // Staff Specific
    private String staffCategory;

    // ---------------- GETTERS AND SETTERS ----------------

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPermanentAddress() { return permanentAddress; }
    public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }

    public String getIrn() { return irn; }
    public void setIrn(String irn) { this.irn = irn; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getHostelName() { return hostelName; }
    public void setHostelName(String hostelName) { this.hostelName = hostelName; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getParentMobile() { return parentMobile; }
    public void setParentMobile(String parentMobile) { this.parentMobile = parentMobile; }

    public String getStaffCategory() { return staffCategory; }
    public void setStaffCategory(String staffCategory) { this.staffCategory = staffCategory; }
}