import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../api/services';
import { jwtDecode } from 'jwt-decode';
import { updateProfile } from './profileSlice';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    emailConfirmed?: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    error: string | null;
    registrationSuccess: boolean;
    registrationMessage: null;
}

const initialState: AuthState = {
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: true,
    error: null,
    registrationSuccess: false,
    registrationMessage: null,
};

interface WithCancelToken {
    cancelToken?: import('axios').CancelToken;
}

export const extractRoleFromToken = (decodedToken: any): 'USER' | 'ADMIN' => {
    if (decodedToken.roles && Array.isArray(decodedToken.roles)) {
        const roles = decodedToken.roles as string[];
        const hasAdminRole = roles.some(role =>
            role.toUpperCase().includes('ADMIN') || role === 'ROLE_ADMIN'
        );

        if (hasAdminRole) {
            return 'ADMIN';
        }

        const hasUserRole = roles.some(role =>
            role.toUpperCase().includes('USER') || role === 'ROLE_USER'
        );

        if (hasUserRole) {
            return 'USER';
        }
    }

    if (typeof decodedToken.roles === 'string') {
        const role = decodedToken.roles.toUpperCase();
        return role.includes('ADMIN') ? 'ADMIN' : 'USER';
    }

    if (decodedToken.role) {
        const role = decodedToken.role.toUpperCase();
        return role.includes('ADMIN') ? 'ADMIN' : 'USER';
    }

    if (decodedToken.authorities && Array.isArray(decodedToken.authorities)) {
        const hasAdminAuth = decodedToken.authorities.some((auth: string) =>
            auth.toUpperCase().includes('ADMIN')
        );
        if (hasAdminAuth) return 'ADMIN';
    }

    return 'USER';
};

const createUserFromToken = (decodedToken: any, email?: string, responseData?: any): User => {
    const role = extractRoleFromToken(decodedToken);

    return {
        id: decodedToken.id || decodedToken.sub || responseData?.id || '',
        email: email || decodedToken.email || '',
        name: responseData?.name || decodedToken.name || email?.split('@')[0] || 'User',
        role: role,
        emailConfirmed: responseData?.emailConfirmed || false,
    };
};

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password, cancelToken }: { email: string; password: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(email, password, { cancelToken });
            const { accessToken, refreshToken } = response.data;

            if (!accessToken) {
                throw new Error('Нет accessToken в ответе');
            }

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            const decodedToken = jwtDecode(accessToken);
            const user = createUserFromToken(decodedToken, email, response.data);
            localStorage.setItem('user', JSON.stringify(user));

            return {
                accessToken,
                refreshToken,
                user
            };
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка входа');
        }
    }
);

export const refreshAccessToken = createAsyncThunk(
    'auth/refresh',
    async ({ cancelToken }: WithCancelToken = {}, { rejectWithValue }) => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authAPI.refresh(refreshToken, { cancelToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
            }

            const decodedToken = jwtDecode(accessToken);
            const userStr = localStorage.getItem('user');
            let storedUser: User | null = null;

            if (userStr) {
                try {
                    storedUser = JSON.parse(userStr);
                } catch {}
            }

            const user = createUserFromToken(
                decodedToken,
                storedUser?.email,
                storedUser
            );

            localStorage.setItem('user', JSON.stringify(user));

            return {
                accessToken,
                refreshToken: newRefreshToken || refreshToken,
                user
            };
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            return rejectWithValue(error.message || 'Ошибка обновления токена');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async ({
               name,
               email,
               password,
               cancelToken
           }: {
        name: string;
        email: string;
        password: string
    } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await authAPI.register(name, email, password, { cancelToken });

            return {
                success: response.data.success,
                message: response.data.message,
                needEmailConfirmation: response.data.needEmailConfirmation || false,
                userId: response.data.userId
            };
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Ошибка регистрации'
            );
        }
    }
);

export const confirmEmail = createAsyncThunk(
    'auth/confirmEmail',
    async ({ token, email, cancelToken }: { token: string; email: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await authAPI.confirmEmail(token, email, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка подтверждения email');
        }
    }
);

export const resendConfirmation = createAsyncThunk(
    'auth/resendConfirmation',
    async ({ email, cancelToken }: { email: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await authAPI.resendConfirmation(email, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка отправки подтверждения');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        },
        clearRegistrationStatus: (state) => {
            state.registrationSuccess = false;
            state.registrationMessage = null;
        },
        updateUserName: (state, action: PayloadAction<string>) => {
            if (state.user) {
                state.user.name = action.payload;
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
        restoreUserFromStorage: (state) => {
            const userStr = localStorage.getItem('user');
            const accessToken = localStorage.getItem('accessToken');

            if (accessToken) {
                state.accessToken = accessToken;
                state.refreshToken = localStorage.getItem('refreshToken');

                try {
                    const decodedToken = jwtDecode(accessToken);

                    if (userStr) {
                        const parsedUser = JSON.parse(userStr) as User;
                        parsedUser.role = extractRoleFromToken(decodedToken);
                        state.user = parsedUser;
                    } else {
                        state.user = createUserFromToken(decodedToken);
                        localStorage.setItem('user', JSON.stringify(state.user));
                    }
                } catch {}
            }

            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.registrationSuccess = false;
                state.registrationMessage = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.registrationSuccess = action.payload.success;
                state.registrationMessage = action.payload.message;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                    state.registrationSuccess = false;
                }
            })

            .addCase(confirmEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(confirmEmail.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(confirmEmail.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(resendConfirmation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resendConfirmation.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(resendConfirmation.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(refreshAccessToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(refreshAccessToken.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(refreshAccessToken.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                    state.user = null;
                    state.accessToken = null;
                    state.refreshToken = null;
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                }
            })

            .addCase(updateProfile.fulfilled, (state, action) => {
                if (state.user && state.user.id === action.payload.id) {
                    state.user.name = action.payload.name;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            });
    },
});

export const { logout, clearError, clearRegistrationStatus, updateUserName, restoreUserFromStorage } = authSlice.actions;
export default authSlice.reducer;