export interface User {
    _id: string;
    name: string;
    email: string;
    type: 'admin' | 'pm' | 'dev' | 'intern' | 'user';
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    _id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: 'Planned' | 'Active' | 'Completed' | 'On Hold';
    createdBy: string | User;
    createdAt: string;
    updatedAt: string;
}

export interface TaskDates {
    assignedDate?: string;
    toStartDate?: string;
    toCompleteDate?: string;
    startedDate?: string;
    completedDate?: string;
}

export interface TaskProgressHistory {
    progress: number;
    timestamp: string;
    note?: string;
}

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    dates: TaskDates;
    project: string | Project;
    createdBy: string | User;
    assignedTo?: string | User;
    parentTask?: string | Task;
    dependencies?: string[] | Task[];
    level: number;
    progress: number;
    weight: number;
    progressHistory: TaskProgressHistory[];
    createdAt: string;
    updatedAt: string;
    // Backend-calculated prediction fields
    predictedStartDate?: string | null;
    predictedEndDate?: string | null;
}

// Auth DTOs
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    type?: 'admin' | 'pm' | 'dev' | 'intern' | 'user'; // Optional, often defaults to 'dev' or 'user'
}

export interface AuthResponse {
    _id: string;
    name: string;
    email: string;
    type: string;
    token: string;
}

// Project DTOs
export interface CreateProjectRequest {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: 'Planned' | 'Active' | 'Completed' | 'On Hold';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> { }

// Task DTOs
export interface CreateTaskRequest {
    title: string;
    project: string; // Project ID
    description?: string;
    status?: 'Pending' | 'In Progress' | 'Completed';
    priority?: 'Low' | 'Medium' | 'High';
    dates?: TaskDates;
    assignedTo?: string; // User ID
    parentTask?: string; // Task ID
    dependencies?: string[]; // Array of Task IDs
    weight?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> { }

export interface UpdateTaskProgressRequest {
    amount: string; // e.g. "+10" or "-5"
    note?: string;
}

// User DTOs (Admin only usually)
export interface CreateUserRequest extends RegisterRequest { }
