// Complete Example: User Management System with .NET Minimal API + Vanilla JS
window.EXAMPLES = {
    'dotnet-minimal-vanilla': {
        complete: {
            title: 'Complete User Management - .NET Minimal API + Vanilla JS',
            subtitle: 'Full-stack example with all 5 layers (Backend + Frontend)',
            description: '<h3>Complete User Management System</h3><p>This is a <strong>complete, production-ready example</strong> showing CRUD operations for users with proper A.D.D V3 separation in both backend and frontend.</p><h4>Features:</h4><ul><li>Create User</li><li>Get User by ID</li><li>List All Users</li><li>Update User</li><li>Delete User</li></ul><h4>What you will see:</h4><ul><li><strong>Backend (.NET)</strong>: All 5 layers - 14 files total</li><li><strong>Frontend (Vanilla JS)</strong>: UI Module with 5 layers - 11 files total</li><li>In-memory database for simplicity (can swap with EF Core)</li><li>Full error handling and validation</li><li>DTO mapping between layers</li></ul><h4>How to use this example:</h4><ol><li><strong>Click "Copy All Code"</strong> button below to copy all files</li><li><strong>Backend setup:</strong> Create .NET project with <code>dotnet new web -n UserManagement</code>, then create folder structure (Boundary/DTOs, CoreAbstractions, Operators, Implementations, Bootstrap) and paste code from clipboard</li><li><strong>Frontend setup:</strong> Create folder structure (ui/boundary, ui/core-abstractions, ui/operators, ui/implementations, ui/bootstrap) and paste respective files</li><li><strong>Run backend:</strong> <code>dotnet run</code> (will run on http://localhost:5000)</li><li><strong>Run frontend:</strong> Use any HTTP server like <code>npx serve .</code> or <code>python -m http.server 8080</code></li><li><strong>Open in browser:</strong> Navigate to your frontend server and test CRUD operations</li></ol><p><strong>Scroll down</strong> to see all 25 files organized by layer. Each file has detailed comments explaining its role in the architecture.</p>',
            architecture: {
                backend: {
                    title: 'Backend Dependency Graph',
                    description: 'Arrows show "depends on" direction',
                    layers: [
                        { name: 'Bootstrap', color: 'bootstrap', dependencies: ['Operators', 'Implementations'] },
                        { name: 'Operators', color: 'operators', dependencies: ['Boundary', 'Core Abstractions'] },
                        { name: 'Core Abstractions', color: 'core', dependencies: [] },
                        { name: 'Implementations', color: 'implementations', dependencies: ['Core Abstractions'] },
                        { name: 'Boundary', color: 'boundary', dependencies: [] }
                    ]
                },
                frontend: {
                    title: 'Frontend Dependency Graph',
                    description: 'Arrows show "depends on" direction',
                    layers: [
                        { name: 'UI/Bootstrap', color: 'bootstrap', dependencies: ['UI/Operators', 'UI/Implementations'] },
                        { name: 'UI/Operators', color: 'operators', dependencies: ['UI/Boundary', 'UI/Core Abstractions'] },
                        { name: 'UI/Core Abstractions', color: 'core', dependencies: [] },
                        { name: 'UI/Implementations', color: 'implementations', dependencies: ['UI/Core Abstractions'] },
                        { name: 'UI/Boundary', color: 'boundary', dependencies: [] }
                    ]
                }
            },
            files: [
                // ==================== BACKEND - BOUNDARY LAYER ====================
                {
                    path: 'Backend/Boundary/DTOs/CreateUserDto.cs',
                    layer: 'Boundary',
                    language: 'csharp',
                    code: `using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UserManagement.Boundary.DTOs;

/// <summary>
/// DTO for creating a new user (external contract)
/// </summary>
public class CreateUserDto
{
    [JsonPropertyName("email")]
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("age")]
    [Range(18, 120, ErrorMessage = "Age must be between 18 and 120")]
    public int Age { get; set; }
}`
                },
                {
                    path: 'Backend/Boundary/DTOs/UpdateUserDto.cs',
                    layer: 'Boundary',
                    language: 'csharp',
                    code: `using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UserManagement.Boundary.DTOs;

/// <summary>
/// DTO for updating existing user
/// </summary>
public class UpdateUserDto
{
    [JsonPropertyName("name")]
    [StringLength(100, MinimumLength = 2)]
    public string? Name { get; set; }

    [JsonPropertyName("age")]
    [Range(18, 120)]
    public int? Age { get; set; }
}`
                },
                {
                    path: 'Backend/Boundary/DTOs/UserDto.cs',
                    layer: 'Boundary',
                    language: 'csharp',
                    code: `using System.Text.Json.Serialization;

namespace UserManagement.Boundary.DTOs;

/// <summary>
/// DTO for returning user data to external clients
/// </summary>
public class UserDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("age")]
    public int Age { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}`
                },
                {
                    path: 'Backend/Boundary/DTOs/UserListDto.cs',
                    layer: 'Boundary',
                    language: 'csharp',
                    code: `using System.Text.Json.Serialization;

namespace UserManagement.Boundary.DTOs;

/// <summary>
/// DTO for returning list of users with pagination info
/// </summary>
public class UserListDto
{
    [JsonPropertyName("users")]
    public List<UserDto> Users { get; set; } = new();

    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }
}`
                },

                // ==================== BACKEND - CORE ABSTRACTIONS LAYER ====================
                {
                    path: 'Backend/CoreAbstractions/Entities/User.cs',
                    layer: 'Core Abstractions',
                    language: 'csharp',
                    code: `namespace UserManagement.CoreAbstractions.Entities;

/// <summary>
/// User entity - internal domain model
/// Thin structure with validation only
/// </summary>
public class User
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Validation method
    public bool IsValid(out List<string> errors)
    {
        errors = new List<string>();

        if (string.IsNullOrWhiteSpace(Email))
            errors.Add("Email is required");

        if (string.IsNullOrWhiteSpace(Name))
            errors.Add("Name is required");

        if (Age < 18 || Age > 120)
            errors.Add("Age must be between 18 and 120");

        return errors.Count == 0;
    }
}`
                },
                {
                    path: 'Backend/CoreAbstractions/Ports/IUserRepository.cs',
                    layer: 'Core Abstractions',
                    language: 'csharp',
                    code: `using UserManagement.CoreAbstractions.Entities;

namespace UserManagement.CoreAbstractions.Ports;

/// <summary>
/// Repository Port - abstraction for user data access
/// Operators call this interface, Implementations provide concrete adapter
/// </summary>
public interface IUserRepository
{
    Task<User?> FindByIdAsync(string id);
    Task<User?> FindByEmailAsync(string email);
    Task<List<User>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<int> GetTotalCountAsync();
    Task SaveAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(string id);
    Task<bool> ExistsAsync(string id);
}`
                },
                {
                    path: 'Backend/CoreAbstractions/Exceptions/UserNotFoundException.cs',
                    layer: 'Core Abstractions',
                    language: 'csharp',
                    code: `namespace UserManagement.CoreAbstractions.Exceptions;

/// <summary>
/// Domain exception - thrown when user is not found
/// </summary>
public class UserNotFoundException : Exception
{
    public string UserId { get; }

    public UserNotFoundException(string userId)
        : base($"User with ID '{userId}' not found")
    {
        UserId = userId;
    }
}`
                },
                {
                    path: 'Backend/CoreAbstractions/Exceptions/ValidationException.cs',
                    layer: 'Core Abstractions',
                    language: 'csharp',
                    code: `namespace UserManagement.CoreAbstractions.Exceptions;

/// <summary>
/// Domain exception - thrown when validation fails
/// </summary>
public class ValidationException : Exception
{
    public List<string> Errors { get; }

    public ValidationException(string message) : base(message)
    {
        Errors = new List<string> { message };
    }

    public ValidationException(List<string> errors)
        : base(string.Join(", ", errors))
    {
        Errors = errors;
    }
}`
                },
                {
                    path: 'Backend/CoreAbstractions/Exceptions/DuplicateUserException.cs',
                    layer: 'Core Abstractions',
                    language: 'csharp',
                    code: `namespace UserManagement.CoreAbstractions.Exceptions;

/// <summary>
/// Domain exception - thrown when trying to create user with existing email
/// </summary>
public class DuplicateUserException : Exception
{
    public string Email { get; }

    public DuplicateUserException(string email)
        : base($"User with email '{email}' already exists")
    {
        Email = email;
    }
}`
                },

                // ==================== BACKEND - OPERATORS LAYER ====================
                {
                    path: 'Backend/Operators/UserOperator.cs',
                    layer: 'Operators',
                    language: 'csharp',
                    code: `using UserManagement.Boundary.DTOs;
using UserManagement.CoreAbstractions.Entities;
using UserManagement.CoreAbstractions.Ports;
using UserManagement.CoreAbstractions.Exceptions;

namespace UserManagement.Operators;

/// <summary>
/// User Operator - business orchestration layer
/// Framework-agnostic: DTO in, DTO out
/// Calls Ports (IUserRepository), never concrete implementations
/// </summary>
public class UserOperator
{
    private readonly IUserRepository _userRepo;

    public UserOperator(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
        // Check if email already exists
        var existing = await _userRepo.FindByEmailAsync(dto.Email);
        if (existing != null)
            throw new DuplicateUserException(dto.Email);

        // Map DTO to Entity
        var entity = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            Name = dto.Name,
            Age = dto.Age,
            CreatedAt = DateTime.UtcNow
        };

        // Validate entity
        if (!entity.IsValid(out var errors))
            throw new ValidationException(errors);

        // Save via Port
        await _userRepo.SaveAsync(entity);

        // Map Entity back to DTO
        return MapToDto(entity);
    }

    public async Task<UserDto> GetUserByIdAsync(string id)
    {
        var entity = await _userRepo.FindByIdAsync(id);
        if (entity == null)
            throw new UserNotFoundException(id);

        return MapToDto(entity);
    }

    public async Task<UserListDto> GetAllUsersAsync(int page = 1, int pageSize = 10)
    {
        var users = await _userRepo.GetAllAsync(page, pageSize);
        var total = await _userRepo.GetTotalCountAsync();

        return new UserListDto
        {
            Users = users.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserDto> UpdateUserAsync(string id, UpdateUserDto dto)
    {
        var entity = await _userRepo.FindByIdAsync(id);
        if (entity == null)
            throw new UserNotFoundException(id);

        // Update only provided fields
        if (!string.IsNullOrWhiteSpace(dto.Name))
            entity.Name = dto.Name;

        if (dto.Age.HasValue)
            entity.Age = dto.Age.Value;

        entity.UpdatedAt = DateTime.UtcNow;

        // Validate updated entity
        if (!entity.IsValid(out var errors))
            throw new ValidationException(errors);

        await _userRepo.UpdateAsync(entity);

        return MapToDto(entity);
    }

    public async Task DeleteUserAsync(string id)
    {
        var exists = await _userRepo.ExistsAsync(id);
        if (!exists)
            throw new UserNotFoundException(id);

        await _userRepo.DeleteAsync(id);
    }

    // DTO <-> Entity mapping (kept in Operators)
    private UserDto MapToDto(User entity)
    {
        return new UserDto
        {
            Id = entity.Id,
            Email = entity.Email,
            Name = entity.Name,
            Age = entity.Age,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}`
                },

                // ==================== BACKEND - IMPLEMENTATIONS LAYER ====================
                {
                    path: 'Backend/Implementations/Database/InMemoryUserRepository.cs',
                    layer: 'Implementations',
                    language: 'csharp',
                    code: `using UserManagement.CoreAbstractions.Entities;
using UserManagement.CoreAbstractions.Ports;

namespace UserManagement.Implementations.Database;

/// <summary>
/// In-memory implementation of IUserRepository
/// Implements Port from Core Abstractions
/// In production: replace with EF Core, Dapper, etc.
/// </summary>
public class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<string, User> _users = new();
    private readonly object _lock = new();

    public Task<User?> FindByIdAsync(string id)
    {
        lock (_lock)
        {
            _users.TryGetValue(id, out var user);
            return Task.FromResult(user);
        }
    }

    public Task<User?> FindByEmailAsync(string email)
    {
        lock (_lock)
        {
            var user = _users.Values.FirstOrDefault(u =>
                u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }
    }

    public Task<List<User>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        lock (_lock)
        {
            var skip = (page - 1) * pageSize;
            var users = _users.Values
                .OrderByDescending(u => u.CreatedAt)
                .Skip(skip)
                .Take(pageSize)
                .ToList();
            return Task.FromResult(users);
        }
    }

    public Task<int> GetTotalCountAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_users.Count);
        }
    }

    public Task SaveAsync(User user)
    {
        lock (_lock)
        {
            _users[user.Id] = user;
            return Task.CompletedTask;
        }
    }

    public Task UpdateAsync(User user)
    {
        lock (_lock)
        {
            if (_users.ContainsKey(user.Id))
            {
                _users[user.Id] = user;
            }
            return Task.CompletedTask;
        }
    }

    public Task DeleteAsync(string id)
    {
        lock (_lock)
        {
            _users.Remove(id);
            return Task.CompletedTask;
        }
    }

    public Task<bool> ExistsAsync(string id)
    {
        lock (_lock)
        {
            return Task.FromResult(_users.ContainsKey(id));
        }
    }
}`
                },

                // ==================== BACKEND - BOOTSTRAP LAYER ====================
                {
                    path: 'Backend/Bootstrap/Program.cs',
                    layer: 'Bootstrap',
                    language: 'csharp',
                    code: `using UserManagement.Bootstrap;

var builder = WebApplication.CreateBuilder(args);

// Register services (DI)
builder.Services.AddUserManagementServices();

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// Map endpoints
app.MapUserEndpoints();

app.Run();`
                },
                {
                    path: 'Backend/Bootstrap/DependencyInjection.cs',
                    layer: 'Bootstrap',
                    language: 'csharp',
                    code: `using UserManagement.CoreAbstractions.Ports;
using UserManagement.Implementations.Database;
using UserManagement.Operators;

namespace UserManagement.Bootstrap;

/// <summary>
/// Dependency Injection configuration
/// Wires all dependencies together
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddUserManagementServices(this IServiceCollection services)
    {
        // Register Repository (Implementations -> Ports)
        services.AddSingleton<IUserRepository, InMemoryUserRepository>();

        // Register Operators
        services.AddScoped<UserOperator>();

        return services;
    }
}`
                },
                {
                    path: 'Backend/Bootstrap/WebApplicationExtensions.cs',
                    layer: 'Bootstrap',
                    language: 'csharp',
                    code: `using Microsoft.AspNetCore.Mvc;
using UserManagement.Boundary.DTOs;
using UserManagement.Operators;
using UserManagement.CoreAbstractions.Exceptions;

namespace UserManagement.Bootstrap;

/// <summary>
/// Endpoint mapping - HTTP adapters (Implementations/Web inline)
/// Translates HTTP requests -> Operator calls -> HTTP responses
/// </summary>
public static class WebApplicationExtensions
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users");

        // Create User
        group.MapPost("/", async ([FromBody] CreateUserDto dto, UserOperator userOp) =>
        {
            try
            {
                var result = await userOp.CreateUserAsync(dto);
                return Results.Created($"/api/users/{result.Id}", result);
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message, errors = ex.Errors });
            }
            catch (DuplicateUserException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("CreateUser")
        .WithOpenApi();

        // Get User by ID
        group.MapGet("/{id}", async (string id, UserOperator userOp) =>
        {
            try
            {
                var result = await userOp.GetUserByIdAsync(id);
                return Results.Ok(result);
            }
            catch (UserNotFoundException)
            {
                return Results.NotFound(new { error = $"User with ID '{id}' not found" });
            }
        })
        .WithName("GetUser")
        .WithOpenApi();

        // Get All Users
        group.MapGet("/", async ([FromQuery] int page, [FromQuery] int pageSize, UserOperator userOp) =>
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 10 : pageSize;

            var result = await userOp.GetAllUsersAsync(page, pageSize);
            return Results.Ok(result);
        })
        .WithName("GetAllUsers")
        .WithOpenApi();

        // Update User
        group.MapPut("/{id}", async (string id, [FromBody] UpdateUserDto dto, UserOperator userOp) =>
        {
            try
            {
                var result = await userOp.UpdateUserAsync(id, dto);
                return Results.Ok(result);
            }
            catch (UserNotFoundException)
            {
                return Results.NotFound(new { error = $"User with ID '{id}' not found" });
            }
            catch (ValidationException ex)
            {
                return Results.BadRequest(new { error = ex.Message, errors = ex.Errors });
            }
        })
        .WithName("UpdateUser")
        .WithOpenApi();

        // Delete User
        group.MapDelete("/{id}", async (string id, UserOperator userOp) =>
        {
            try
            {
                await userOp.DeleteUserAsync(id);
                return Results.NoContent();
            }
            catch (UserNotFoundException)
            {
                return Results.NotFound(new { error = $"User with ID '{id}' not found" });
            }
        })
        .WithName("DeleteUser")
        .WithOpenApi();
    }
}`
                },

                // ==================== FRONTEND - UI/BOUNDARY ====================
                {
                    path: 'Frontend/ui/boundary/screen-props.js',
                    layer: 'UI/Boundary',
                    language: 'javascript',
                    code: `// External contracts for UI screens
// Props that screens accept from outside

export const UserListScreenProps = {
    containerId: 'string',  // DOM element ID to render into
    onUserSelected: 'function'  // Callback when user is clicked
};

export const CreateUserScreenProps = {
    containerId: 'string',
    onSuccess: 'function',  // Callback when user created successfully
    onCancel: 'function'
};

export const EditUserScreenProps = {
    containerId: 'string',
    userId: 'string',  // User ID to edit
    onSuccess: 'function',
    onCancel: 'function'
};`
                },

                // ==================== FRONTEND - UI/CORE ABSTRACTIONS ====================
                {
                    path: 'Frontend/ui/core-abstractions/ports/IApiClient.js',
                    layer: 'UI/Core Abstractions',
                    language: 'javascript',
                    code: `// Port (interface) for API communication
// Operators call this abstraction, Implementations provide concrete adapter

export class IApiClient {
    async get(url) {
        throw new Error('Not implemented');
    }

    async post(url, data) {
        throw new Error('Not implemented');
    }

    async put(url, data) {
        throw new Error('Not implemented');
    }

    async delete(url) {
        throw new Error('Not implemented');
    }
}`
                },
                {
                    path: 'Frontend/ui/core-abstractions/ports/INotificationService.js',
                    layer: 'UI/Core Abstractions',
                    language: 'javascript',
                    code: `// Port for showing notifications to user

export class INotificationService {
    success(message) {
        throw new Error('Not implemented');
    }

    error(message) {
        throw new Error('Not implemented');
    }

    info(message) {
        throw new Error('Not implemented');
    }
}`
                },
                {
                    path: 'Frontend/ui/core-abstractions/view-models/UserViewModel.js',
                    layer: 'UI/Core Abstractions',
                    language: 'javascript',
                    code: `// ViewModel - internal UI representation with computed/formatted fields

export class UserViewModel {
    constructor(userData) {
        this.id = userData.id;
        this.email = userData.email;
        this.name = userData.name;
        this.age = userData.age;
        this.createdAt = userData.createdAt;
        this.updatedAt = userData.updatedAt;
    }

    // Computed properties
    get displayCreatedAt() {
        return new Date(this.createdAt).toLocaleDateString();
    }

    get displayAge() {
        return this.age + ' years old';
    }

    get initials() {
        return this.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
}`
                },

                // ==================== FRONTEND - UI/OPERATORS ====================
                {
                    path: 'Frontend/ui/operators/UserListOperator.js',
                    layer: 'UI/Operators',
                    language: 'javascript',
                    code: `import { UserViewModel } from '../core-abstractions/view-models/UserViewModel.js';

// Presentation Operator - orchestrates user list logic
// Framework-agnostic business presentation logic

export class UserListOperator {
    constructor(apiClient, notificationService) {
        this.apiClient = apiClient;
        this.notificationService = notificationService;
    }

    async loadUsers(page = 1, pageSize = 10) {
        try {
            // Call API via Port
            const response = await this.apiClient.get(
                \`/api/users?page=\${page}&pageSize=\${pageSize}\`
            );

            // Map DTOs to ViewModels
            const viewModels = response.users.map(user => new UserViewModel(user));

            return {
                users: viewModels,
                total: response.total,
                page: response.page,
                pageSize: response.pageSize
            };
        } catch (error) {
            this.notificationService.error('Failed to load users: ' + error.message);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            await this.apiClient.delete(\`/api/users/\${userId}\`);
            this.notificationService.success('User deleted successfully');
        } catch (error) {
            this.notificationService.error('Failed to delete user: ' + error.message);
            throw error;
        }
    }
}`
                },
                {
                    path: 'Frontend/ui/operators/UserFormOperator.js',
                    layer: 'UI/Operators',
                    language: 'javascript',
                    code: `// Form submission operator - handles create/update logic

export class UserFormOperator {
    constructor(apiClient, notificationService) {
        this.apiClient = apiClient;
        this.notificationService = notificationService;
    }

    async createUser(formData) {
        try {
            // Client-side validation
            const errors = this.validateUserForm(formData);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }

            // Map form data to DTO
            const dto = {
                email: formData.email,
                name: formData.name,
                age: parseInt(formData.age)
            };

            // Call API via Port
            const result = await this.apiClient.post('/api/users', dto);
            this.notificationService.success('User created successfully');
            return result;
        } catch (error) {
            this.notificationService.error('Failed to create user: ' + error.message);
            throw error;
        }
    }

    async updateUser(userId, formData) {
        try {
            const dto = {
                name: formData.name,
                age: parseInt(formData.age)
            };

            const result = await this.apiClient.put(\`/api/users/\${userId}\`, dto);
            this.notificationService.success('User updated successfully');
            return result;
        } catch (error) {
            this.notificationService.error('Failed to update user: ' + error.message);
            throw error;
        }
    }

    validateUserForm(formData) {
        const errors = [];

        if (!formData.email || !formData.email.includes('@')) {
            errors.push('Valid email is required');
        }

        if (!formData.name || formData.name.length < 2) {
            errors.push('Name must be at least 2 characters');
        }

        const age = parseInt(formData.age);
        if (isNaN(age) || age < 18 || age > 120) {
            errors.push('Age must be between 18 and 120');
        }

        return errors;
    }
}`
                },

                // ==================== FRONTEND - UI/IMPLEMENTATIONS ====================
                {
                    path: 'Frontend/ui/implementations/api/FetchApiClient.js',
                    layer: 'UI/Implementations',
                    language: 'javascript',
                    code: `import { IApiClient } from '../../core-abstractions/ports/IApiClient.js';

// Concrete implementation of IApiClient using Fetch API
// Adapter for HTTP communication

export class FetchApiClient extends IApiClient {
    constructor(baseUrl) {
        super();
        this.baseUrl = baseUrl;
    }

    async get(url) {
        const response = await fetch(this.baseUrl + url);
        if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }
        return await response.json();
    }

    async post(url, data) {
        const response = await fetch(this.baseUrl + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || response.statusText);
        }
        return await response.json();
    }

    async put(url, data) {
        const response = await fetch(this.baseUrl + url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || response.statusText);
        }
        return await response.json();
    }

    async delete(url) {
        const response = await fetch(this.baseUrl + url, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }
        return response.status === 204 ? null : await response.json();
    }
}`
                },
                {
                    path: 'Frontend/ui/implementations/notifications/ToastNotificationService.js',
                    layer: 'UI/Implementations',
                    language: 'javascript',
                    code: `import { INotificationService } from '../../core-abstractions/ports/INotificationService.js';

// Simple toast notification implementation
// Adapter for showing notifications

export class ToastNotificationService extends INotificationService {
    success(message) {
        this.showToast(message, 'success');
    }

    error(message) {
        this.showToast(message, 'error');
    }

    info(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = \`toast toast-\${type}\`;
        toast.textContent = message;
        toast.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: \${type === 'success' ? '#27c93f' : type === 'error' ? '#ff5f56' : '#4a9eff'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        \`;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}`
                },
                {
                    path: 'Frontend/ui/implementations/html/index.html',
                    layer: 'UI/Implementations',
                    language: 'markup',
                    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management - A.D.D V3</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>User Management System</h1>
            <p>Full-stack A.D.D V3 Example</p>
        </header>

        <!-- User List Screen -->
        <div id="user-list-screen">
            <div class="screen-header">
                <h2>Users</h2>
                <button id="btn-create-user" class="btn btn-primary">+ Create User</button>
            </div>
            <div id="user-list-container"></div>
        </div>

        <!-- Create/Edit User Screen (hidden by default) -->
        <div id="user-form-screen" style="display: none;">
            <div class="screen-header">
                <h2 id="form-title">Create User</h2>
                <button id="btn-cancel-form" class="btn">Cancel</button>
            </div>
            <form id="user-form">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Age</label>
                    <input type="number" name="age" min="18" max="120" required>
                </div>
                <button type="submit" class="btn btn-primary">Save</button>
            </form>
        </div>
    </div>

    <!-- Bootstrap app -->
    <script type="module" src="../../bootstrap/app.js"></script>
</body>
</html>`
                },
                {
                    path: 'Frontend/ui/implementations/html/styles.css',
                    layer: 'UI/Implementations',
                    language: 'css',
                    code: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f5f5;
    padding: 2rem;
}

.container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
}

header h1 {
    color: #333;
    margin-bottom: 0.5rem;
}

header p {
    color: #666;
}

.screen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    background: #f0f0f0;
    color: #333;
    transition: all 0.2s;
}

.btn:hover {
    background: #e0e0e0;
}

.btn-primary {
    background: #4a9eff;
    color: white;
}

.btn-primary:hover {
    background: #3a8eef;
}

.user-card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-card:hover {
    border-color: #4a9eff;
    background: #f9f9f9;
}

.user-info h3 {
    margin-bottom: 0.25rem;
    color: #333;
}

.user-info p {
    color: #666;
    font-size: 0.9rem;
}

.user-actions {
    display: flex;
    gap: 0.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: #4a9eff;
}`
                },

                // ==================== FRONTEND - UI/BOOTSTRAP ====================
                {
                    path: 'Frontend/ui/bootstrap/app.js',
                    layer: 'UI/Bootstrap',
                    language: 'javascript',
                    code: `// Bootstrap - Application entry point
// Wires all dependencies together and initializes app

import { FetchApiClient } from '../implementations/api/FetchApiClient.js';
import { ToastNotificationService } from '../implementations/notifications/ToastNotificationService.js';
import { UserListOperator } from '../operators/UserListOperator.js';
import { UserFormOperator } from '../operators/UserFormOperator.js';

// DI Container - wiring dependencies
const apiClient = new FetchApiClient('http://localhost:5000');
const notificationService = new ToastNotificationService();

const userListOperator = new UserListOperator(apiClient, notificationService);
const userFormOperator = new UserFormOperator(apiClient, notificationService);

// Initialize UI
async function initializeApp() {
    await loadUserList();
    attachEventListeners();
}

async function loadUserList() {
    try {
        const data = await userListOperator.loadUsers();
        renderUserList(data.users);
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function renderUserList(users) {
    const container = document.getElementById('user-list-container');
    container.innerHTML = users.map(user => \`
        <div class="user-card">
            <div class="user-info">
                <h3>\${user.name} (\${user.initials})</h3>
                <p>\${user.email} - \${user.displayAge}</p>
                <p>Created: \${user.displayCreatedAt}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn-edit" data-id="\${user.id}">Edit</button>
                <button class="btn btn-delete" data-id="\${user.id}">Delete</button>
            </div>
        </div>
    \`).join('');

    // Attach delete/edit handlers
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.dataset.id;
            if (confirm('Are you sure?')) {
                await userListOperator.deleteUser(userId);
                await loadUserList();
            }
        });
    });
}

function attachEventListeners() {
    // Create user button
    document.getElementById('btn-create-user').addEventListener('click', () => {
        showFormScreen('create');
    });

    // Cancel button
    document.getElementById('btn-cancel-form').addEventListener('click', () => {
        showListScreen();
    });

    // Form submit
    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        await userFormOperator.createUser(data);
        showListScreen();
        await loadUserList();
    });
}

function showFormScreen(mode) {
    document.getElementById('user-list-screen').style.display = 'none';
    document.getElementById('user-form-screen').style.display = 'block';
    document.getElementById('form-title').textContent = mode === 'create' ? 'Create User' : 'Edit User';
}

function showListScreen() {
    document.getElementById('user-list-screen').style.display = 'block';
    document.getElementById('user-form-screen').style.display = 'none';
    document.getElementById('user-form').reset();
}

// Start app
initializeApp();`
                }
            ]
        }
    }
};
