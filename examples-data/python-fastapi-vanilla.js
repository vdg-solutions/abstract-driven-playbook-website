// Python FastAPI + Vanilla JS Example
// Complete User Management System with all 5 layers

window.EXAMPLES = window.EXAMPLES || {};
window.EXAMPLES['python-fastapi-vanilla'] = {
    complete: {
        title: 'Complete User Management - Python FastAPI + Vanilla JS',
        subtitle: 'Full-stack example with all 5 layers (Backend + Frontend)',
        description: '<h3>Complete User Management System</h3><p>This is a <strong>complete, production-ready example</strong> showing CRUD operations for users with proper A.D.D V3 separation in both backend and frontend.</p><h4>Features:</h4><ul><li>Create User</li><li>Get User by ID</li><li>List All Users</li><li>Update User</li><li>Delete User</li></ul><h4>What you will see:</h4><ul><li><strong>Backend (Python FastAPI)</strong>: All 5 layers - 14 files total</li><li><strong>Frontend (Vanilla JS)</strong>: UI Module with 5 layers - 11 files total</li><li>In-memory database for simplicity (can swap with SQLAlchemy)</li><li>Full error handling and validation with Pydantic</li><li>DTO mapping between layers</li></ul><h4>How to use this example:</h4><ol><li><strong>Click "Copy All Code"</strong> button below to copy all files</li><li><strong>Backend setup:</strong> Create virtual environment with <code>python -m venv venv</code>, install dependencies <code>pip install fastapi uvicorn pydantic</code>, then create folder structure (boundary/dtos, core_abstractions, operators, implementations, bootstrap) and paste code</li><li><strong>Frontend setup:</strong> Create folder structure (ui/boundary, ui/core-abstractions, ui/operators, ui/implementations, ui/bootstrap) and paste respective files</li><li><strong>Run backend:</strong> <code>uvicorn bootstrap.main:app --reload --port 8000</code> (will run on http://localhost:8000)</li><li><strong>Run frontend:</strong> Use any HTTP server like <code>npx serve .</code> or <code>python -m http.server 8080</code></li><li><strong>Open in browser:</strong> Navigate to your frontend server and test CRUD operations</li></ol><p><strong>Scroll down</strong> to see all 25 files organized by layer. Each file has detailed comments explaining its role in the architecture.</p>',
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
                path: 'Backend/boundary/dtos/create_user_dto.py',
                layer: 'Boundary',
                language: 'python',
                code: `from pydantic import BaseModel, EmailStr, Field

# DTO for creating a new user (external contract)
class CreateUserDto(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., min_length=2, max_length=100, description="User full name")
    age: int = Field(..., ge=18, le=120, description="User age")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "name": "John Doe",
                "age": 30
            }
        }`
            },
            {
                path: 'Backend/boundary/dtos/update_user_dto.py',
                layer: 'Boundary',
                language: 'python',
                code: `from pydantic import BaseModel, Field
from typing import Optional

# DTO for updating existing user
class UpdateUserDto(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=120)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Updated",
                "age": 31
            }
        }`
            },
            {
                path: 'Backend/boundary/dtos/user_dto.py',
                layer: 'Boundary',
                language: 'python',
                code: `from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# DTO for returning user data to external clients
class UserDto(BaseModel):
    id: str
    email: str
    name: str
    age: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "john.doe@example.com",
                "name": "John Doe",
                "age": 30,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": None
            }
        }`
            },
            {
                path: 'Backend/boundary/dtos/user_list_dto.py',
                layer: 'Boundary',
                language: 'python',
                code: `from pydantic import BaseModel
from typing import List
from .user_dto import UserDto

# DTO for returning list of users with pagination info
class UserListDto(BaseModel):
    users: List[UserDto]
    total: int
    page: int
    page_size: int`
            },

            // ==================== BACKEND - CORE ABSTRACTIONS LAYER ====================
            {
                path: 'Backend/core_abstractions/entities/user.py',
                layer: 'Core Abstractions',
                language: 'python',
                code: `from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

# User entity - internal domain model
# Thin structure with validation only
@dataclass
class User:
    id: str
    email: str
    name: str
    age: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    def is_valid(self) -> tuple[bool, List[str]]:
        """Validate entity"""
        errors = []

        if not self.email or '@' not in self.email:
            errors.append("Email is required and must be valid")

        if not self.name or len(self.name) < 2:
            errors.append("Name is required and must be at least 2 characters")

        if self.age < 18 or self.age > 120:
            errors.append("Age must be between 18 and 120")

        return len(errors) == 0, errors`
            },
            {
                path: 'Backend/core_abstractions/ports/i_user_repository.py',
                layer: 'Core Abstractions',
                language: 'python',
                code: `from abc import ABC, abstractmethod
from typing import Optional, List
from ..entities.user import User

# Repository Port - abstraction for user data access
# Operators call this interface, Implementations provide concrete adapter
class IUserRepository(ABC):

    @abstractmethod
    async def find_by_id(self, user_id: str) -> Optional[User]:
        pass

    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    async def get_all(self, page: int = 1, page_size: int = 10) -> List[User]:
        pass

    @abstractmethod
    async def get_total_count(self) -> int:
        pass

    @abstractmethod
    async def save(self, user: User) -> None:
        pass

    @abstractmethod
    async def update(self, user: User) -> None:
        pass

    @abstractmethod
    async def delete(self, user_id: str) -> None:
        pass

    @abstractmethod
    async def exists(self, user_id: str) -> bool:
        pass`
            },
            {
                path: 'Backend/core_abstractions/exceptions/user_not_found_exception.py',
                layer: 'Core Abstractions',
                language: 'python',
                code: `# Domain exception - thrown when user is not found
class UserNotFoundException(Exception):
    def __init__(self, user_id: str):
        self.user_id = user_id
        super().__init__(f"User with ID '{user_id}' not found")`
            },
            {
                path: 'Backend/core_abstractions/exceptions/validation_exception.py',
                layer: 'Core Abstractions',
                language: 'python',
                code: `from typing import List

# Domain exception - thrown when validation fails
class ValidationException(Exception):
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(", ".join(errors))`
            },
            {
                path: 'Backend/core_abstractions/exceptions/duplicate_user_exception.py',
                layer: 'Core Abstractions',
                language: 'python',
                code: `# Domain exception - thrown when trying to create user with existing email
class DuplicateUserException(Exception):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"User with email '{email}' already exists")`
            },

            // ==================== BACKEND - OPERATORS LAYER ====================
            {
                path: 'Backend/operators/user_operator.py',
                layer: 'Operators',
                language: 'python',
                code: `from datetime import datetime
import uuid
from typing import Optional

from boundary.dtos.create_user_dto import CreateUserDto
from boundary.dtos.update_user_dto import UpdateUserDto
from boundary.dtos.user_dto import UserDto
from boundary.dtos.user_list_dto import UserListDto
from core_abstractions.entities.user import User
from core_abstractions.ports.i_user_repository import IUserRepository
from core_abstractions.exceptions.user_not_found_exception import UserNotFoundException
from core_abstractions.exceptions.validation_exception import ValidationException
from core_abstractions.exceptions.duplicate_user_exception import DuplicateUserException

# User Operator - business orchestration layer
# Framework-agnostic: DTO in, DTO out
# Calls Ports (IUserRepository), never concrete implementations
class UserOperator:
    def __init__(self, user_repo: IUserRepository):
        self._user_repo = user_repo

    async def create_user(self, dto: CreateUserDto) -> UserDto:
        # Check if email already exists
        existing = await self._user_repo.find_by_email(dto.email)
        if existing:
            raise DuplicateUserException(dto.email)

        # Map DTO to Entity
        entity = User(
            id=str(uuid.uuid4()),
            email=dto.email,
            name=dto.name,
            age=dto.age,
            created_at=datetime.utcnow()
        )

        # Validate entity
        is_valid, errors = entity.is_valid()
        if not is_valid:
            raise ValidationException(errors)

        # Save via Port
        await self._user_repo.save(entity)

        # Map Entity back to DTO
        return self._map_to_dto(entity)

    async def get_user_by_id(self, user_id: str) -> UserDto:
        entity = await self._user_repo.find_by_id(user_id)
        if not entity:
            raise UserNotFoundException(user_id)

        return self._map_to_dto(entity)

    async def get_all_users(self, page: int = 1, page_size: int = 10) -> UserListDto:
        users = await self._user_repo.get_all(page, page_size)
        total = await self._user_repo.get_total_count()

        return UserListDto(
            users=[self._map_to_dto(u) for u in users],
            total=total,
            page=page,
            page_size=page_size
        )

    async def update_user(self, user_id: str, dto: UpdateUserDto) -> UserDto:
        entity = await self._user_repo.find_by_id(user_id)
        if not entity:
            raise UserNotFoundException(user_id)

        # Update only provided fields
        if dto.name is not None:
            entity.name = dto.name

        if dto.age is not None:
            entity.age = dto.age

        entity.updated_at = datetime.utcnow()

        # Validate updated entity
        is_valid, errors = entity.is_valid()
        if not is_valid:
            raise ValidationException(errors)

        await self._user_repo.update(entity)

        return self._map_to_dto(entity)

    async def delete_user(self, user_id: str) -> None:
        exists = await self._user_repo.exists(user_id)
        if not exists:
            raise UserNotFoundException(user_id)

        await self._user_repo.delete(user_id)

    # DTO <-> Entity mapping (kept in Operators)
    def _map_to_dto(self, entity: User) -> UserDto:
        return UserDto(
            id=entity.id,
            email=entity.email,
            name=entity.name,
            age=entity.age,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )`
            },

            // ==================== BACKEND - IMPLEMENTATIONS LAYER ====================
            {
                path: 'Backend/implementations/database/in_memory_user_repository.py',
                layer: 'Implementations',
                language: 'python',
                code: `from typing import Optional, List, Dict
import threading

from core_abstractions.entities.user import User
from core_abstractions.ports.i_user_repository import IUserRepository

# In-memory implementation of IUserRepository
# Implements Port from Core Abstractions
# In production: replace with SQLAlchemy, async PostgreSQL, etc.
class InMemoryUserRepository(IUserRepository):
    def __init__(self):
        self._users: Dict[str, User] = {}
        self._lock = threading.Lock()

    async def find_by_id(self, user_id: str) -> Optional[User]:
        with self._lock:
            return self._users.get(user_id)

    async def find_by_email(self, email: str) -> Optional[User]:
        with self._lock:
            for user in self._users.values():
                if user.email.lower() == email.lower():
                    return user
            return None

    async def get_all(self, page: int = 1, page_size: int = 10) -> List[User]:
        with self._lock:
            skip = (page - 1) * page_size
            users = sorted(
                self._users.values(),
                key=lambda u: u.created_at,
                reverse=True
            )
            return users[skip:skip + page_size]

    async def get_total_count(self) -> int:
        with self._lock:
            return len(self._users)

    async def save(self, user: User) -> None:
        with self._lock:
            self._users[user.id] = user

    async def update(self, user: User) -> None:
        with self._lock:
            if user.id in self._users:
                self._users[user.id] = user

    async def delete(self, user_id: str) -> None:
        with self._lock:
            self._users.pop(user_id, None)

    async def exists(self, user_id: str) -> bool:
        with self._lock:
            return user_id in self._users`
            },

            // ==================== BACKEND - BOOTSTRAP LAYER ====================
            {
                path: 'Backend/bootstrap/main.py',
                layer: 'Bootstrap',
                language: 'python',
                code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .dependency_injection import setup_dependencies
from .routes import setup_routes

# Create FastAPI app
app = FastAPI(
    title="User Management API",
    description="Complete A.D.D V3 example with FastAPI",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup DI and routes
setup_dependencies(app)
setup_routes(app)`
            },
            {
                path: 'Backend/bootstrap/dependency_injection.py',
                layer: 'Bootstrap',
                language: 'python',
                code: `from fastapi import FastAPI
from implementations.database.in_memory_user_repository import InMemoryUserRepository
from operators.user_operator import UserOperator

# Global instances (singleton pattern)
_user_repository = None
_user_operator = None

def setup_dependencies(app: FastAPI):
    """Wires all dependencies together"""
    global _user_repository, _user_operator

    # Create singleton instances
    _user_repository = InMemoryUserRepository()
    _user_operator = UserOperator(_user_repository)

def get_user_operator() -> UserOperator:
    """Dependency injection for user operator"""
    return _user_operator`
            },
            {
                path: 'Backend/bootstrap/routes.py',
                layer: 'Bootstrap',
                language: 'python',
                code: `from fastapi import FastAPI, Depends, HTTPException, status, Query
from typing import Annotated

from boundary.dtos.create_user_dto import CreateUserDto
from boundary.dtos.update_user_dto import UpdateUserDto
from operators.user_operator import UserOperator
from core_abstractions.exceptions.user_not_found_exception import UserNotFoundException
from core_abstractions.exceptions.validation_exception import ValidationException
from core_abstractions.exceptions.duplicate_user_exception import DuplicateUserException
from .dependency_injection import get_user_operator

# Endpoint mapping - HTTP adapters (Implementations/Web inline)
# Translates HTTP requests -> Operator calls -> HTTP responses
def setup_routes(app: FastAPI):

    @app.post("/api/users", status_code=status.HTTP_201_CREATED)
    async def create_user(
        dto: CreateUserDto,
        user_op: Annotated[UserOperator, Depends(get_user_operator)]
    ):
        try:
            result = await user_op.create_user(dto)
            return result
        except ValidationException as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": str(e), "errors": e.errors}
            )
        except DuplicateUserException as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": str(e)}
            )

    @app.get("/api/users/{user_id}")
    async def get_user(
        user_id: str,
        user_op: Annotated[UserOperator, Depends(get_user_operator)]
    ):
        try:
            result = await user_op.get_user_by_id(user_id)
            return result
        except UserNotFoundException:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"User with ID '{user_id}' not found"}
            )

    @app.get("/api/users")
    async def get_all_users(
        page: int = Query(1, ge=1),
        pageSize: int = Query(10, ge=1, le=100),
        user_op: Annotated[UserOperator, Depends(get_user_operator)]
    ):
        result = await user_op.get_all_users(page, pageSize)
        return result

    @app.put("/api/users/{user_id}")
    async def update_user(
        user_id: str,
        dto: UpdateUserDto,
        user_op: Annotated[UserOperator, Depends(get_user_operator)]
    ):
        try:
            result = await user_op.update_user(user_id, dto)
            return result
        except UserNotFoundException:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"User with ID '{user_id}' not found"}
            )
        except ValidationException as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": str(e), "errors": e.errors}
            )

    @app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_user(
        user_id: str,
        user_op: Annotated[UserOperator, Depends(get_user_operator)]
    ):
        try:
            await user_op.delete_user(user_id)
        except UserNotFoundException:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"User with ID '{user_id}' not found"}
            )`
            },

            // ==================== FRONTEND - Same as .NET example ====================
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
        this.createdAt = userData.createdAt || userData.created_at;
        this.updatedAt = userData.updatedAt || userData.updated_at;
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
                pageSize: response.page_size || response.pageSize
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
            throw new Error(error.detail?.error || response.statusText);
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
            throw new Error(error.detail?.error || response.statusText);
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
    <title>User Management - A.D.D V3 (Python)</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>User Management System</h1>
            <p>Full-stack A.D.D V3 Example - Python FastAPI</p>
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
// NOTE: Python FastAPI runs on port 8000 by default
const apiClient = new FetchApiClient('http://localhost:8000');
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
};
