import api from './index';
import { User, CreateUserRequest } from './types';

const ENDPOINT = '/users';

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>(ENDPOINT);
    return response.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>(ENDPOINT, data);
    return response.data;
};
