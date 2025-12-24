import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ordersAPI } from '../../api/services';
import axios from 'axios';

export interface CartItem {
    dishId: string;
    restaurantId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface CartItemRequest {
    dish_id: string;
    restaurant_id: string;
    quantity: number;
    price: number;
    name?: string;
    image?: string;
}

export interface Address {
    street: string;
    city: string;
    zip: string;
    state?: string;
    country: string;
}

interface CartState {
    items: CartItem[];
    restaurantId: string | null;
    deliveryAddress: Address | null;
    loading: boolean;
    error: string | null;
}

interface WithCancelToken {
    cancelToken?: import('axios').CancelToken;
}

export function toCartItemRequest(cartItem: CartItem): CartItemRequest {
    return {
        dish_id: cartItem.dishId,
        restaurant_id: cartItem.restaurantId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        name: cartItem.name,
        image: cartItem.image
    };
}

export function toCartItemRequestArray(cartItems: CartItem[]): CartItemRequest[] {
    return cartItems.map(toCartItemRequest);
}

export const createOrder = createAsyncThunk(
    'cart/createOrder',
    async ({
               restaurantId,
               items,
               cancelToken
           }: {
        restaurantId: string;
        items: any[]
    } & WithCancelToken, { rejectWithValue }) => {
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

const getInitialState = (): CartState => {
    try {
        const cartItems = localStorage.getItem('cart');
        const restaurantId = localStorage.getItem('cartRestaurantId');
        const deliveryAddress = localStorage.getItem('cartDeliveryAddress');

        return {
            items: cartItems ? JSON.parse(cartItems) : [],
            restaurantId: restaurantId,
            deliveryAddress: deliveryAddress ? JSON.parse(deliveryAddress) : null,
            loading: false,
            error: null,
        };
    } catch (error) {
        return {
            items: [],
            restaurantId: null,
            deliveryAddress: null,
            loading: false,
            error: null,
        };
    }
};

const initialState: CartState = getInitialState();

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const { dishId, restaurantId, quantity = 1 } = action.payload;

            if (state.restaurantId && state.restaurantId !== restaurantId) {
                state.items = [];
                state.deliveryAddress = null;
                localStorage.removeItem('cartDeliveryAddress');
            }

            state.restaurantId = restaurantId;

            const existingItem = state.items.find(item => item.dishId === dishId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                state.items.push({ ...action.payload, quantity });
            }

            localStorage.setItem('cart', JSON.stringify(state.items));
            localStorage.setItem('cartRestaurantId', restaurantId);
        },

        updateQuantity: (state, action: PayloadAction<{ dishId: string; quantity: number }>) => {
            const { dishId, quantity } = action.payload;

            if (quantity <= 0) {
                state.items = state.items.filter(item => item.dishId !== dishId);
            } else {
                const item = state.items.find(item => item.dishId === dishId);
                if (item) {
                    item.quantity = quantity;
                }
            }

            if (state.items.length === 0) {
                state.restaurantId = null;
                state.deliveryAddress = null;
                localStorage.removeItem('cartRestaurantId');
                localStorage.removeItem('cartDeliveryAddress');
            }

            localStorage.setItem('cart', JSON.stringify(state.items));
        },

        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(item => item.dishId !== action.payload);

            if (state.items.length === 0) {
                state.restaurantId = null;
                state.deliveryAddress = null;
                localStorage.removeItem('cartRestaurantId');
                localStorage.removeItem('cartDeliveryAddress');
            }

            localStorage.setItem('cart', JSON.stringify(state.items));
        },

        clearCart: (state) => {
            state.items = [];
            state.restaurantId = null;
            state.deliveryAddress = null;
            localStorage.removeItem('cart');
            localStorage.removeItem('cartRestaurantId');
            localStorage.removeItem('cartDeliveryAddress');
        },

        setDeliveryAddress: (state, action: PayloadAction<Address | null>) => {
            state.deliveryAddress = action.payload;
            if (action.payload) {
                localStorage.setItem('cartDeliveryAddress', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('cartDeliveryAddress');
            }
        },

        restoreCart: (state, action: PayloadAction<{ items: CartItem[], restaurantId: string | null }>) => {
            const { items, restaurantId } = action.payload;

            if (state.items.length === 0) {
                state.items = items;
                state.restaurantId = restaurantId;
            }

            localStorage.setItem('cart', JSON.stringify(state.items));
            if (restaurantId) {
                localStorage.setItem('cartRestaurantId', restaurantId);
            }
        },

        clearDeliveryAddress: (state) => {
            state.deliveryAddress = null;
            localStorage.removeItem('cartDeliveryAddress');
        },

        restoreCartFromStorage: (state, action: PayloadAction<Partial<CartState>>) => {
            const { items, restaurantId, deliveryAddress } = action.payload;

            if (items && Array.isArray(items)) {
                state.items = items;
            }

            if (restaurantId !== undefined) {
                state.restaurantId = restaurantId;
            }

            if (deliveryAddress !== undefined) {
                state.deliveryAddress = deliveryAddress;
            }

            localStorage.setItem('cart', JSON.stringify(state.items));
            if (restaurantId) {
                localStorage.setItem('cartRestaurantId', restaurantId);
            }
            if (deliveryAddress) {
                localStorage.setItem('cartDeliveryAddress', JSON.stringify(deliveryAddress));
            }
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
            .addCase(createOrder.fulfilled, (state) => {
                state.loading = false;
                state.items = [];
                state.restaurantId = null;
                state.deliveryAddress = null;
                localStorage.removeItem('cart');
                localStorage.removeItem('cartRestaurantId');
                localStorage.removeItem('cartDeliveryAddress');
            })
            .addCase(createOrder.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            });
    },
});

export const {
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setDeliveryAddress,
    restoreCartFromStorage,
    clearDeliveryAddress,
    restoreCart,
    clearError,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartRestaurantId = (state: { cart: CartState }) => state.cart.restaurantId;
export const selectCartDeliveryAddress = (state: { cart: CartState }) => state.cart.deliveryAddress;
export const selectCartTotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectCartItemsCount = (state: { cart: CartState }) =>
    state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;

export default cartSlice.reducer;