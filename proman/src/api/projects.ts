import api from './index';
import { Project, CreateProjectRequest, UpdateProjectRequest } from './types';

const ENDPOINT = '/projects';

export const getProjects = async (): Promise<Project[]> => {
    const response = await api.get<Project[]>(ENDPOINT);
    return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`${ENDPOINT}/${id}`);
    return response.data;
};

export const createProject = async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post<Project>(ENDPOINT, data);
    return response.data;
};

export const updateProject = async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await api.put<Project>(`${ENDPOINT}/${id}`, data);
    return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};
