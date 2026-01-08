import axios from 'axios';

const API_USER_URL = import.meta.env.VITE_USER_API_URL;
const API_RESTAURANT_URL = import.meta.env.VITE_RESTAURANT_API_URL;
const API_ORDER_URL = import.meta.env.VITE_ORDER_API_URL;

const commonConfig = {
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
};

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const refreshToken = async (): Promise<string | null> => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_USER_URL}/auth/refresh`, {
            refreshToken
        }, commonConfig);

        const { accessToken, newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
        }

        return accessToken;
    } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return null;
    }
};

const createAxiosInstance = (baseURL: string) => {
    const instance = axios.create({
        ...commonConfig,
        baseURL,
    });

    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('accessToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            const isDeleteAccountRequest =
                error.config?.url?.includes('/users/') &&
                error.config?.method === 'delete';

            const isChangePasswordRequest =
                error.config?.url?.includes('/change-password') ||
                error.config?.url?.includes('/password');

            const isRefreshRequest = error.config?.url?.includes('/auth/refresh');

            if (error.response?.status === 401 &&
                !isDeleteAccountRequest &&
                !isChangePasswordRequest &&
                !isRefreshRequest &&
                !originalRequest._retry) {

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return instance(originalRequest);
                        })
                        .catch(err => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const newAccessToken = await refreshToken();

                    if (newAccessToken) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        processQueue(null, newAccessToken);
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

export const userApi = createAxiosInstance(API_USER_URL);
export const restaurantApi = createAxiosInstance(API_RESTAURANT_URL);
export const orderApi = createAxiosInstance(API_ORDER_URL);

export default userApi;