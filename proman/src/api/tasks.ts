import api from './index';
import { Task, CreateTaskRequest, UpdateTaskRequest, UpdateTaskProgressRequest } from './types';

const ENDPOINT = '/tasks';

export const getTasks = async (projectId?: string, parentTask?: string): Promise<Task[]> => {
    const params: any = {};
    if (projectId) params.project = projectId;
    if (parentTask) params.parentTask = parentTask;
    const response = await api.get<Task[]>(ENDPOINT, { params });
    return response.data;
};

export const getTaskById = async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`${ENDPOINT}/${id}`);
    return response.data;
};

export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<Task>(ENDPOINT, data);
    return response.data;
};

export interface BulkCreateTasksRequest {
    tasks: Omit<CreateTaskRequest, 'project' | 'parentTask'>[];
    project: string;
    parentTask?: string;
}

export const createBulkTasks = async (data: BulkCreateTasksRequest): Promise<Task[]> => {
    const response = await api.post<Task[]>(`${ENDPOINT}/bulk`, data);
    return response.data;
};

export const updateTask = async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await api.put<Task>(`${ENDPOINT}/${id}`, data);
    return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};

export const startTask = async (id: string): Promise<Task> => {
    const response = await api.post<Task>(`${ENDPOINT}/${id}/start`);
    return response.data;
};

export const updateTaskProgress = async (id: string, data: UpdateTaskProgressRequest): Promise<Task> => {
    const response = await api.patch<Task>(`${ENDPOINT}/${id}/progress`, data);
    return response.data;
};

export const completeTask = async (id: string): Promise<Task> => {
    const response = await api.post<Task>(`${ENDPOINT}/${id}/complete`);
    return response.data;
};

export interface SimulationConditions {
    memberLeaves?: Array<{
        userId: string;
        startDate: string;
        endDate: string;
    }>;
    globalHolidays?: Array<{
        startDate: string;
        endDate: string;
    }>;
    taskDelays?: Array<{
        taskId: string;
        additionalDays: number;
    }>;
}

export const simulateTasks = async (projectId: string, conditions: SimulationConditions): Promise<Task[]> => {
    const response = await api.post<Task[]>(`${ENDPOINT}/simulate/${projectId}`, { conditions });
    return response.data;
};
