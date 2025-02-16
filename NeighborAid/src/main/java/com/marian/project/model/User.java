package com.marian.project.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
public class User {

    @OneToMany(mappedBy = "user")
    @JsonIgnore  // Prevents recursion when serializing User -> Request
    private List<Request> requests;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name cannot be blank")
    private String firstName;

    @NotBlank(message = "Last name cannot be blank")
    private String lastName;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    private String password;

    @NotNull(message = "Role cannot be null")
    private Integer role;  // (0 = Admin, 1 = User, 2 = Volunteer)

    @NotNull(message = "Age cannot be null")
    @Min(value = 18, message = "Age must be at least 18")
    private Integer age;

    @NotBlank(message = "Phone number cannot be blank")
    private String phoneNo;

    @NotBlank(message = "House number cannot be blank")
    private String houseNo;
    
    // New field to track banned status
    private Boolean banned = false; // Default is not banned

    // Constructors
    public User() {
        super();
    }

    public User(Long id, @NotBlank(message = "First name cannot be blank") String firstName,
                @NotBlank(message = "Last name cannot be blank") String lastName,
                @NotBlank(message = "Email cannot be blank") @Email(message = "Email must be valid") String email,
                @NotBlank(message = "Password cannot be blank") String password,
                @NotNull(message = "Role cannot be null") Integer role,
                @NotNull(message = "Age cannot be null") @Min(value = 18, message = "Age must be at least 18") Integer age,
                @NotBlank(message = "Phone number cannot be blank") String phoneNo,
                @NotBlank(message = "House number cannot be blank") String houseNo) {
        super();
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.age = age;
        this.phoneNo = phoneNo;
        this.houseNo = houseNo;
    }

    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public String getFirstName() { 
        return firstName; 
    }
    public void setFirstName(String firstName) { 
        this.firstName = firstName; 
    }
    
    public String getLastName() { 
        return lastName; 
    }
    public void setLastName(String lastName) { 
        this.lastName = lastName; 
    }
    
    public String getEmail() { 
        return email; 
    }
    public void setEmail(String email) { 
        this.email = email; 
    }
    
    public String getPassword() { 
        return password; 
    }
    public void setPassword(String password) { 
        this.password = password; 
    }
    
    public Integer getRole() { 
        return role; 
    }
    public void setRole(Integer role) { 
        this.role = role; 
    }
    
    public Integer getAge() { 
        return age; 
    }
    public void setAge(Integer age) { 
        this.age = age; 
    }
    
    public String getPhoneNo() { 
        return phoneNo; 
    }
    public void setPhoneNo(String phoneNo) { 
        this.phoneNo = phoneNo; 
    }
    
    public String getHouseNo() { 
        return houseNo; 
    }
    public void setHouseNo(String houseNo) { 
        this.houseNo = houseNo; 
    }
    
    public List<Request> getRequests() { 
        return requests; 
    }
    public void setRequests(List<Request> requests) { 
        this.requests = requests; 
    }
    
    // Getter and Setter for banned field
    public Boolean getBanned() {
        return banned;
    }
    public void setBanned(Boolean banned) {
        this.banned = banned;
    }
    
    @Override
    public String toString() {
        return "User [id=" + id + ", firstName=" + firstName + ", lastName=" + lastName +
               ", email=" + email + ", password=" + password + ", role=" + role +
               ", age=" + age + ", phoneNo=" + phoneNo + ", houseNo=" + houseNo +
               ", banned=" + banned + "]";
    }
}
