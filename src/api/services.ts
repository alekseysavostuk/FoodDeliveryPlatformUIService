import { userApi, restaurantApi, orderApi } from './axiosInstance';

export interface AddressData {
    street: string;
    city: string;
    zip: string;
    state?: string;
    country: string;
}

export interface Address extends AddressData {
    id: string;
    userId: string;
    isDefault: boolean;
    createdAt: string;
}

export interface ChangePassword {
    email: string;
    oldPassword: string;
    newPassword: string;
}

export interface RestaurantUpdateData {
    id: string;
    name: string;
    cuisine: string;
    address: string;
}

export interface RestaurantCreateData {
    name: string;
    cuisine: string;
    address: string;
}

export interface DishCreateData {
    name: string;
    description: string;
    price: string;
}

export interface DishUpdateData {
    id: string;
    name: string;
    description: string;
    price: string;
}

interface RequestOptions {
    cancelToken?: import('axios').CancelToken;
}

export const authAPI = {
    login: (email: string, password: string, options?: RequestOptions) => {
        return userApi.post('/auth/login', { email, password }, options);
    },

    refresh: (refreshToken?: string, options?: RequestOptions) => {
        const token = refreshToken || localStorage.getItem('refreshToken');
        return userApi.post('/auth/refresh', { refreshToken: token }, options);
    },

    register: (name: string, phoneNumber: string, email: string, password: string, options?: RequestOptions) => {
        return userApi.post('/auth/register', { name, phoneNumber, email, password }, options);
    },

    confirmEmail: (token: string, email: string, options?: RequestOptions) => {
        return userApi.post('/auth/confirm-email', { token, email }, options);
    },

    resendConfirmation: (email: string, options?: RequestOptions) => {
        return userApi.post('/auth/resend-confirmation', { email }, options);
    },

    logout: (options?: RequestOptions) => {
        const refreshToken = localStorage.getItem('refreshToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return userApi.post('/auth/logout', { refreshToken }, options);
    }
};

export const profileAPI = {
    updateProfile: (userData: { id: string; name: string; phoneNumber?: string }, options?: RequestOptions) => {
        return userApi.put(`/users`, userData, options);
    },

    changePassword: (id: string, changePassword: ChangePassword, options?: RequestOptions) => {
        return userApi.patch(`/users/${id}/change-password`, changePassword, options);
    },

    getAddresses: (id: string, options?: RequestOptions) => {
        return userApi.get(`/users/${id}/addresses`, options);
    },

    getAllUsers: (options?: RequestOptions) => {
        return userApi.get(`/users`, options);
    },

    getUserById: (id: string, options?: RequestOptions) => {
        return userApi.get(`/users/${id}`, options);
    },

    deleteUser: (id: string, password: string, options?: RequestOptions) => {
        return userApi.delete(`/users/${id}`, { data: { password }, ...options });
    },

    deleteUserAdmin: (id: string, options?: RequestOptions) => {
        return userApi.delete(`/users/${id}/admin`, options);
    },

    addAddress: (id: string, address: AddressData, options?: RequestOptions) => {
        return userApi.post(`/users/${id}/addresses`, address, options);
    },

    updateAddress: (address: AddressData, options?: RequestOptions) => {
        return userApi.put(`/addresses`, address, options);
    },

    deleteAddress: (id: string, options?: RequestOptions) => {
        return userApi.delete(`addresses/${id}`, options);
    },
};

export const restaurantsAPI = {
    getAll: (options?: RequestOptions) => restaurantApi.get('/restaurants', options),
    getById: (id: string, options?: RequestOptions) => restaurantApi.get(`/restaurants/${id}`, options),
    create: (data: RestaurantCreateData, options?: RequestOptions) => restaurantApi.post('/restaurants', data, options),
    update: (data: RestaurantUpdateData, options?: RequestOptions) => restaurantApi.put(`/restaurants`, data, options),
    delete: (id: string, options?: RequestOptions) => restaurantApi.delete(`/restaurants/${id}`, options),
    getImages: (restaurantId: string, options?: RequestOptions) => restaurantApi.get(`/restaurants/${restaurantId}/images`, options),
    deleteImage: (restaurantId: string, imageName: string, options?: RequestOptions) =>
        restaurantApi.delete(`/restaurants/${restaurantId}/images?image=${encodeURIComponent(imageName)}`, options),
    deleteAllImage: (restaurantId: string, options?: RequestOptions) => restaurantApi.delete(`/restaurants/${restaurantId}/images/all`, options),
    uploadImage: (restaurantId: string, file: File, options?: RequestOptions) => {
        const formData = new FormData();
        formData.append('file', file);
        return restaurantApi.post(`/restaurants/${restaurantId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...options,
        });
    }
};

export const dishesAPI = {
    getByRestaurant: (restaurantId: string, options?: RequestOptions) => restaurantApi.get(`/restaurants/${restaurantId}/dishes`, options),
    create: (restaurantId: string, data: DishCreateData, options?: RequestOptions) => restaurantApi.post(`/restaurants/${restaurantId}/dishes`, data, options),
    update: (data: DishUpdateData, options?: RequestOptions) => restaurantApi.put(`dishes`, data, options),
    delete: (dishId: string, options?: RequestOptions) => restaurantApi.delete(`/dishes/${dishId}`, options),
    getByDish: (dishId: string, options?: RequestOptions) => restaurantApi.get(`/dishes/${dishId}`, options),
    getImages: (dishId: string, options?: RequestOptions) => restaurantApi.get(`/dishes/${dishId}/images`, options),
    deleteImage: (dishId: string, imageName: string, options?: RequestOptions) =>
        restaurantApi.delete(`/dishes/${dishId}/images?image=${encodeURIComponent(imageName)}`, options),
    deleteAllImage: (dishId: string, options?: RequestOptions) => restaurantApi.delete(`/dishes/${dishId}/images/all`, options),
    uploadImage: (dishId: string, file: File, options?: RequestOptions) => {
        const formData = new FormData();
        formData.append('file', file);
        return restaurantApi.post(`/dishes/${dishId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...options,
        });
    }
};

export const ordersAPI = {
    create: (restaurantId: string, items: any[], options?: RequestOptions) => orderApi.post(`/orders?restaurantId=${restaurantId}`, items, options),
    getById: (id: string, options?: RequestOptions) => orderApi.get(`/orders/${id}`, options),
    getUserOrders: (id: string, options?: RequestOptions) => orderApi.get(`/orders/user/${id}`, options),
    getAllOrders: (params?: any, options?: RequestOptions) => orderApi.get('/orders', { params, ...options }),
    delete: (params?: any, options?: RequestOptions) => orderApi.get('/orders', { params, ...options }),
    updateStatus: (id: string, options?: RequestOptions) => orderApi.patch(`/orders/${id}/status`, {}, options),
    createPayment: (id: string, paymentMethod: string, options?: RequestOptions) => orderApi.post(`/orders/${id}/payment`, { method: paymentMethod }, options),
    getPaymentById: (id: string, options?: RequestOptions) => orderApi.get(`/payment/${id}`, options),
};