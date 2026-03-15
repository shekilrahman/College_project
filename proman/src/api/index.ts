import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle global errors (optional but recommended)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors here, e.g., logging out on 401
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default api;
