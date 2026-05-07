import api from './index';
import { User, CreateUserRequest, Project } from './types';

const ENDPOINT = '/users';

export interface UserDetailResponse {
    user: User;
    projects: Project[];
}

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>(ENDPOINT);
    return response.data;
};

export const getUserById = async (id: string): Promise<UserDetailResponse> => {
    const response = await api.get<UserDetailResponse>(`${ENDPOINT}/${id}`);
    return response.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>(ENDPOINT, data);
    return response.data;
};

export const updateUser = async (id: string, data: Partial<CreateUserRequest>): Promise<User> => {
    const response = await api.put<User>(`${ENDPOINT}/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${ENDPOINT}/${id}`);
    return response.data;
};
