import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileAPI, type AddressData, type Address } from '../../api/services';
import axios from 'axios';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN' | 'MANAGER';
    active: boolean;
    emailConfirmed: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ProfileState {
    userProfile: {
        name: string;
        email: string;
    } | null;
    addresses: Address[];
    loading: boolean;
    error: string | null;
    allUsers: User[];
    selectedUser: User | null;
    usersLoading: boolean;
    usersError: string | null;
}

const initialState: ProfileState = {
    userProfile: null,
    addresses: [],
    loading: false,
    error: null,
    allUsers: [],
    selectedUser: null,
    usersLoading: false,
    usersError: null,
};

interface WithCancelToken {
    cancelToken?: import('axios').CancelToken;
}

export const fetchAddresses = createAsyncThunk(
    'profile/fetchAddresses',
    async ({ userId, cancelToken }: { userId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await profileAPI.getAddresses(userId, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки адресов');
        }
    }
);

export const fetchAllUsers = createAsyncThunk(
    'profile/fetchAllUsers',
    async ({ cancelToken }: WithCancelToken = {}, { rejectWithValue }) => {
        try {
            const response = await profileAPI.getAllUsers({ cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователей');
        }
    }
);

export const fetchUserById = createAsyncThunk(
    'profile/fetchUserById',
    async ({ id, cancelToken }: { id: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await profileAPI.getUserById(id, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователя');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'profile/update',
    async (userData: { id: string; name: string }, { rejectWithValue }) => {
        try {
            const response = await profileAPI.updateProfile(userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления профиля');
        }
    }
);

export const changePassword = createAsyncThunk(
    'profile/changePassword',
    async ({
               userId,
               email,
               oldPassword,
               newPassword
           }: {
        userId: string;
        email: string;
        oldPassword: string;
        newPassword: string
    }, { rejectWithValue }) => {
        try {
            const response = await profileAPI.changePassword(
                userId,
                {
                    email,
                    oldPassword,
                    newPassword
                }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка смены пароля');
        }
    }
);

export const addAddress = createAsyncThunk(
    'profile/addAddress',
    async ({ id, address }: { id: string; address: AddressData }, { rejectWithValue }) => {
        try {
            const response = await profileAPI.addAddress(id, address);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка добавления адреса');
        }
    }
);

export const updateAddress = createAsyncThunk(
    'profile/updateAddress',
    async (addressData: AddressData & { id: string }, { rejectWithValue }) => {
        try {
            const response = await profileAPI.updateAddress(addressData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления адреса');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'profile/deleteUser',
    async ({ id, password }: { id: string; password: string }, { rejectWithValue }) => {
        try {
            await profileAPI.deleteUser(id, password);
            return id;
        } catch (error: any) {
            if (error.response?.status === 403) {
                return rejectWithValue('Неверный пароль');
            }

            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Ошибка удаления пользователя'
            );
        }
    }
);

export const deleteAddress = createAsyncThunk(
    'profile/deleteAddress',
    async (id: string, { rejectWithValue }) => {
        try {
            await profileAPI.deleteAddress(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления адреса');
        }
    }
);

export const updateUserAdmin = createAsyncThunk(
    'profile/updateUserAdmin',
    async ({ id, userData }: { id: string; userData: Partial<User> }, { rejectWithValue }) => {
        try {
            const response = await profileAPI.updateProfile({ id, name: userData.name || '' });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления пользователя');
        }
    }
);

export const deleteUserAdmin = createAsyncThunk(
    'profile/deleteUserAdmin',
    async (id: string, { rejectWithValue }) => {
        try {
            await profileAPI.deleteUserAdmin(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления пользователя');
        }
    }
);

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        clearProfileError: (state) => {
            state.error = null;
            state.usersError = null;
        },
        clearSelectedUser: (state) => {
            state.selectedUser = null;
        },
        clearUsersList: (state) => {
            state.allUsers = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.userProfile = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.addresses = action.payload;
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.error = action.payload as string;
                }
            })
            .addCase(addAddress.fulfilled, (state, action) => {
                state.addresses.push(action.payload);
            })
            .addCase(deleteAddress.fulfilled, (state, action) => {
                state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
            })
            .addCase(updateAddress.fulfilled, (state, action) => {
                const updatedAddress = action.payload;
                const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);

                if (index !== -1) {
                    state.addresses[index] = updatedAddress;
                }
            })
            .addCase(updateAddress.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(fetchAllUsers.pending, (state) => {
                state.usersLoading = true;
                state.usersError = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.allUsers = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.usersLoading = false;
                    state.usersError = action.payload as string;
                }
            })
            .addCase(fetchUserById.pending, (state) => {
                state.usersLoading = true;
                state.usersError = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.selectedUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.usersLoading = false;
                    state.usersError = action.payload as string;
                }
            })
            .addCase(deleteUserAdmin.fulfilled, (state, action) => {
                state.allUsers = state.allUsers.filter(user => user.id !== action.payload);
                if (state.selectedUser?.id === action.payload) {
                    state.selectedUser = null;
                }
            })
            .addCase(updateUserAdmin.fulfilled, (state, action) => {
                const updatedUser = action.payload;
                const index = state.allUsers.findIndex(user => user.id === updatedUser.id);
                if (index !== -1) {
                    state.allUsers[index] = { ...state.allUsers[index], ...updatedUser };
                }
                if (state.selectedUser?.id === updatedUser.id) {
                    state.selectedUser = { ...state.selectedUser, ...updatedUser };
                }
            });
    },
});

export const { clearProfileError, clearSelectedUser, clearUsersList } = profileSlice.actions;
export default profileSlice.reducer;