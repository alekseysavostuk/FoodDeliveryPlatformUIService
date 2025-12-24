import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../api/services';
import axios from 'axios';

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export interface Order {
    id: string;
    userId: string;
    restaurantId: string;
    restaurantName?: string;
    items: any[];
    totalPrice: number;
    status: OrderStatus;
    orderDate: string;
    payment?: Payment;
}

export interface Payment {
    id: string;
    method: string;
    status: string;
    amount: number;
    orderId?: string;
}

interface OrdersState {
    list: Order[];
    currentOrder: Order | null;
    loading: boolean;
    error: string | null;
    paymentLoading: boolean;
    paymentError: string | null;
    currentPayment: Payment | null;
}

const initialState: OrdersState = {
    list: [],
    currentOrder: null,
    loading: false,
    error: null,
    paymentLoading: false,
    paymentError: null,
    currentPayment: null,
};

interface WithCancelToken {
    cancelToken?: import('axios').CancelToken;
}

export const createOrder = createAsyncThunk(
    'orders/create',
    async ({ restaurantId, items, cancelToken }: { restaurantId: string; items: any[] } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.create(restaurantId, items, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка создания заказа');
        }
    }
);

export const createPayment = createAsyncThunk(
    'orders/createPayment',
    async ({ id, paymentMethod, cancelToken }: { id: string; paymentMethod: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.createPayment(id, paymentMethod, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка обработки платежа');
        }
    }
);

export const fetchOrderById = createAsyncThunk(
    'orders/fetchById',
    async ({ id, cancelToken }: { id: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.getById(id, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказа');
        }
    }
);

export const fetchPaymentById = createAsyncThunk(
    'payment/fetchById',
    async ({ id, cancelToken }: { id: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.getPaymentById(id, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки оплаты');
        }
    }
);

export const fetchUserOrders = createAsyncThunk(
    'orders/fetchUserOrders',
    async ({ userId, cancelToken }: { userId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            if (!userId || userId === 'undefined') {
                return rejectWithValue('User ID is required');
            }
            const response = await ordersAPI.getUserOrders(userId, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказов');
        }
    }
);

export const fetchAllOrders = createAsyncThunk(
    'orders/fetchAll',
    async ({ params, cancelToken }: { params: any } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.getAllOrders(params, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказов');
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'orders/updateStatus',
    async ({ orderId, cancelToken }: { orderId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await ordersAPI.updateStatus(orderId, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления статуса');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        clearCurrentPayment: (state) => {
            state.currentPayment = null;
        },
        clearPaymentError: (state) => {
            state.paymentError = null;
        },
        setPaymentLoading: (state, action) => {
            state.paymentLoading = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
                state.list.unshift(action.payload);
            })
            .addCase(createOrder.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(createPayment.pending, (state) => {
                state.paymentLoading = true;
                state.paymentError = null;
            })
            .addCase(createPayment.fulfilled, (state, action) => {
                state.paymentLoading = false;
                state.currentPayment = action.payload;
            })
            .addCase(createPayment.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.paymentLoading = false;
                    state.paymentError = action.payload as string;
                }
            })

            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(fetchPaymentById.pending, (state) => {
                state.paymentLoading = true;
            })
            .addCase(fetchPaymentById.fulfilled, (state, action) => {
                state.paymentLoading = false;
                state.currentPayment = action.payload;
            })
            .addCase(fetchPaymentById.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.paymentLoading = false;
                    state.paymentError = action.payload as string;
                }
            })

            .addCase(fetchUserOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchUserOrders.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(fetchAllOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchAllOrders.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(updateOrderStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.list.findIndex(o => o.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
                if (state.currentOrder?.id === action.payload.id) {
                    state.currentOrder = action.payload;
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            });
    },
});

export const {
    clearCurrentOrder,
    clearCurrentPayment,
    clearPaymentError,
    setPaymentLoading,
    clearError,
} = ordersSlice.actions;

export default ordersSlice.reducer;