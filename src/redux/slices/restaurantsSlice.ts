import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { restaurantsAPI, dishesAPI } from '../../api/services';
import type { DishCreateData, DishUpdateData } from '../../api/services';
import axios from 'axios';

export interface Dish {
    id: string;
    name: string;
    description: string;
    price: number;
    images?: string[];
    restaurantId: string;
}

export interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    address: string;
    rating?: number;
    images?: string[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RestaurantCreateData {
    name: string;
    cuisine: string;
    address: string;
}

export interface RestaurantUpdateData {
    id: string;
    name: string;
    cuisine: string;
    address: string;
}

interface RestaurantsState {
    list: Restaurant[];
    selectedRestaurant: Restaurant | null;
    dishes: Dish[];
    loading: boolean;
    error: string | null;
    filters: {
        cuisine: string;
        minRating: number;
        maxDeliveryTime: number;
    };
    dishImages: Record<string, string[]>;
    dishImageLoading: Record<string, boolean>;
    restaurantImages: Record<string, string[]>;
    restaurantImageLoading: Record<string, boolean>;
}

const initialState: RestaurantsState = {
    list: [],
    selectedRestaurant: null,
    dishes: [],
    loading: false,
    error: null,
    filters: {
        cuisine: '',
        minRating: 0,
        maxDeliveryTime: 100,
    },
    dishImages: {},
    dishImageLoading: {},
    restaurantImages: {},
    restaurantImageLoading: {},
};

interface WithCancelToken {
    cancelToken?: import('axios').CancelToken;
}

export const fetchRestaurants = createAsyncThunk(
    'restaurants/fetchAll',
    async ({ cancelToken }: WithCancelToken = {}, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.getAll({ cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки ресторанов');
        }
    }
);

export const fetchRestaurantById = createAsyncThunk(
    'restaurants/fetchById',
    async ({ id, cancelToken }: { id: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.getById(id, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки ресторана');
        }
    }
);

export const createRestaurant = createAsyncThunk(
    'restaurants/create',
    async (data: RestaurantCreateData, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.create(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка создания ресторана');
        }
    }
);

export const updateRestaurant = createAsyncThunk(
    'restaurants/update',
    async (data: RestaurantUpdateData, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.update(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления ресторана');
        }
    }
);

export const deleteRestaurant = createAsyncThunk(
    'restaurants/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await restaurantsAPI.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления ресторана');
        }
    }
);

export const fetchRestaurantImages = createAsyncThunk(
    'restaurants/fetchRestaurantImages',
    async ({ restaurantId, cancelToken }: { restaurantId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.getImages(restaurantId, { cancelToken });
            return { restaurantId, images: response.data };
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки изображений ресторана');
        }
    }
);

export const uploadRestaurantImage = createAsyncThunk(
    'restaurants/uploadRestaurantImage',
    async ({ restaurantId, file }: { restaurantId: string; file: File }, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.uploadImage(restaurantId, file);
            return { restaurantId, restaurant: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки изображения ресторана');
        }
    }
);

export const deleteRestaurantImage = createAsyncThunk(
    'restaurants/deleteRestaurantImage',
    async ({ restaurantId, imageName }: { restaurantId: string; imageName: string }, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.deleteImage(restaurantId, imageName);
            return { restaurantId, restaurant: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления изображения ресторана');
        }
    }
);

export const deleteAllRestaurantImages = createAsyncThunk(
    'restaurants/deleteAllRestaurantImages',
    async (restaurantId: string, { rejectWithValue }) => {
        try {
            const response = await restaurantsAPI.deleteAllImage(restaurantId);
            return { restaurantId, restaurant: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления изображений ресторана');
        }
    }
);

export const fetchDishes = createAsyncThunk(
    'restaurants/fetchDishes',
    async ({ restaurantId, cancelToken }: { restaurantId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.getByRestaurant(restaurantId, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки меню');
        }
    }
);

export const createDish = createAsyncThunk(
    'dishes/create',
    async ({ restaurantId, data }: { restaurantId: string; data: DishCreateData }, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.create(restaurantId, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка создания блюда');
        }
    }
);

export const updateDish = createAsyncThunk(
    'dishes/update',
    async (data: DishUpdateData, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.update(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка обновления блюда');
        }
    }
);

export const deleteDish = createAsyncThunk(
    'dishes/delete',
    async (dishId: string, { rejectWithValue }) => {
        try {
            await dishesAPI.delete(dishId);
            return dishId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления блюда');
        }
    }
);

export const fetchDishById = createAsyncThunk(
    'dishes/fetchById',
    async ({ dishId, cancelToken }: { dishId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.getByDish(dishId, { cancelToken });
            return response.data;
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки блюда');
        }
    }
);

export const fetchDishImages = createAsyncThunk(
    'dishes/fetchImages',
    async ({ dishId, cancelToken }: { dishId: string } & WithCancelToken, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.getImages(dishId, { cancelToken });
            return { dishId, images: response.data };
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return rejectWithValue('CANCELLED');
            }
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки изображений');
        }
    }
);

export const uploadDishImage = createAsyncThunk(
    'dishes/uploadImage',
    async ({ dishId, file }: { dishId: string; file: File }, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.uploadImage(dishId, file);
            return { dishId, dish: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки изображения');
        }
    }
);

export const deleteDishImage = createAsyncThunk(
    'dishes/deleteImage',
    async ({ dishId, imageName }: { dishId: string; imageName: string }, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.deleteImage(dishId, imageName);
            return { dishId, dish: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления изображения');
        }
    }
);

export const deleteAllDishImages = createAsyncThunk(
    'dishes/deleteAllImages',
    async (dishId: string, { rejectWithValue }) => {
        try {
            const response = await dishesAPI.deleteAllImage(dishId);
            return { dishId, dish: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка удаления изображений');
        }
    }
);

const restaurantsSlice = createSlice({
    name: 'restaurants',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<RestaurantsState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearSelectedRestaurant: (state) => {
            state.selectedRestaurant = null;
            state.dishes = [];
        },
        clearError: (state) => {
            state.error = null;
        },
        resetLoading: (state) => {
            state.loading = false;
        },
        updateRestaurantInList: (state, action: PayloadAction<Restaurant>) => {
            const index = state.list.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        removeRestaurantFromList: (state, action: PayloadAction<string>) => {
            state.list = state.list.filter(r => r.id !== action.payload);
        },
        updateDishInList: (state, action: PayloadAction<Dish>) => {
            const index = state.dishes.findIndex(d => d.id === action.payload.id);
            if (index !== -1) {
                state.dishes[index] = action.payload;
            } else {
                state.dishes.push(action.payload);
            }
        },
        removeDishFromList: (state, action: PayloadAction<string>) => {
            state.dishes = state.dishes.filter(d => d.id !== action.payload);
        },
        clearDishImages: (state, action: PayloadAction<string>) => {
            const dishId = action.payload;
            delete state.dishImages[dishId];
            delete state.dishImageLoading[dishId];
        },
        updateDishImages: (state, action: PayloadAction<{ dishId: string; images: string[] }>) => {
            const { dishId, images } = action.payload;
            state.dishImages[dishId] = images;
        },
        setDishImageLoading: (state, action: PayloadAction<{ dishId: string; loading: boolean }>) => {
            const { dishId, loading } = action.payload;
            state.dishImageLoading[dishId] = loading;
        },
        clearRestaurantImages: (state, action: PayloadAction<string>) => {
            const restaurantId = action.payload;
            delete state.restaurantImages[restaurantId];
            delete state.restaurantImageLoading[restaurantId];
        },
        updateRestaurantImages: (state, action: PayloadAction<{ restaurantId: string; images: string[] }>) => {
            const { restaurantId, images } = action.payload;
            state.restaurantImages[restaurantId] = images;
        },
        setRestaurantImageLoading: (state, action: PayloadAction<{ restaurantId: string; loading: boolean }>) => {
            const { restaurantId, loading } = action.payload;
            state.restaurantImageLoading[restaurantId] = loading;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRestaurants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRestaurants.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload || [];
                action.payload?.forEach((restaurant: Restaurant) => {
                    if (restaurant.images && restaurant.id) {
                        state.restaurantImages[restaurant.id] = restaurant.images;
                    }
                });
            })
            .addCase(fetchRestaurants.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(fetchRestaurantById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRestaurantById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedRestaurant = action.payload;
                if (action.payload.images && action.payload.id) {
                    state.restaurantImages[action.payload.id] = action.payload.images;
                }
            })
            .addCase(fetchRestaurantById.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(createRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.list.push(action.payload);
                    if (action.payload.id) {
                        state.restaurantImages[action.payload.id] = action.payload.images || [];
                    }
                }
            })
            .addCase(createRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(updateRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const index = state.list.findIndex(r => r.id === action.payload.id);
                    if (index !== -1) {
                        state.list[index] = action.payload;
                    }
                    if (state.selectedRestaurant?.id === action.payload.id) {
                        state.selectedRestaurant = action.payload;
                    }
                    if (action.payload.images && action.payload.id) {
                        state.restaurantImages[action.payload.id] = action.payload.images;
                    }
                }
            })
            .addCase(updateRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(deleteRestaurant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteRestaurant.fulfilled, (state, action) => {
                state.loading = false;
                const restaurantId = action.payload;
                state.list = state.list.filter(r => r.id !== restaurantId);
                if (state.selectedRestaurant?.id === restaurantId) {
                    state.selectedRestaurant = null;
                    state.dishes = [];
                }
                delete state.restaurantImages[restaurantId];
                delete state.restaurantImageLoading[restaurantId];
            })
            .addCase(deleteRestaurant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(fetchRestaurantImages.pending, (state, action) => {
                const restaurantId = action.meta.arg.restaurantId;
                state.restaurantImageLoading[restaurantId] = true;
            })
            .addCase(fetchRestaurantImages.fulfilled, (state, action) => {
                const { restaurantId, images } = action.payload;
                state.restaurantImages[restaurantId] = images;
                state.restaurantImageLoading[restaurantId] = false;

                const restaurantIndex = state.list.findIndex(r => r.id === restaurantId);
                if (restaurantIndex !== -1) {
                    state.list[restaurantIndex].images = images;
                }
                if (state.selectedRestaurant?.id === restaurantId) {
                    state.selectedRestaurant.images = images;
                }
            })
            .addCase(fetchRestaurantImages.rejected, (state, action) => {
                const restaurantId = action.meta.arg.restaurantId;
                state.restaurantImageLoading[restaurantId] = false;
                if (action.payload !== 'CANCELLED') {
                    state.error = action.payload as string;
                }
            })

            .addCase(uploadRestaurantImage.pending, (state, action) => {
                const { restaurantId } = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = true;
            })
            .addCase(uploadRestaurantImage.fulfilled, (state, action) => {
                const { restaurantId, restaurant } = action.payload;
                state.restaurantImageLoading[restaurantId] = false;

                const index = state.list.findIndex(r => r.id === restaurantId);
                if (index !== -1) {
                    state.list[index] = restaurant;
                }
                if (state.selectedRestaurant?.id === restaurantId) {
                    state.selectedRestaurant = restaurant;
                }

                if (restaurant.images && restaurant.id) {
                    state.restaurantImages[restaurantId] = restaurant.images;
                }
            })
            .addCase(uploadRestaurantImage.rejected, (state, action) => {
                const { restaurantId } = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = false;
                state.error = action.payload as string;
            })

            .addCase(deleteRestaurantImage.pending, (state, action) => {
                const { restaurantId } = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = true;
            })
            .addCase(deleteRestaurantImage.fulfilled, (state, action) => {
                const { restaurantId, restaurant } = action.payload;
                state.restaurantImageLoading[restaurantId] = false;

                const index = state.list.findIndex(r => r.id === restaurantId);
                if (index !== -1) {
                    state.list[index] = restaurant;
                }
                if (state.selectedRestaurant?.id === restaurantId) {
                    state.selectedRestaurant = restaurant;
                }

                if (restaurant.images && restaurant.id) {
                    state.restaurantImages[restaurantId] = restaurant.images;
                }
            })
            .addCase(deleteRestaurantImage.rejected, (state, action) => {
                const { restaurantId } = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = false;
                state.error = action.payload as string;
            })

            .addCase(deleteAllRestaurantImages.pending, (state, action) => {
                const restaurantId = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = true;
            })
            .addCase(deleteAllRestaurantImages.fulfilled, (state, action) => {
                const { restaurantId, restaurant } = action.payload;
                state.restaurantImageLoading[restaurantId] = false;

                const index = state.list.findIndex(r => r.id === restaurantId);
                if (index !== -1) {
                    state.list[index] = restaurant;
                }
                if (state.selectedRestaurant?.id === restaurantId) {
                    state.selectedRestaurant = restaurant;
                }

                state.restaurantImages[restaurantId] = restaurant.images || [];
            })
            .addCase(deleteAllRestaurantImages.rejected, (state, action) => {
                const restaurantId = action.meta.arg;
                state.restaurantImageLoading[restaurantId] = false;
                state.error = action.payload as string;
            })

            .addCase(fetchDishes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishes.fulfilled, (state, action) => {
                state.loading = false;
                state.dishes = action.payload || [];
                action.payload?.forEach((dish: Dish) => {
                    if (dish.images && dish.id) {
                        state.dishImages[dish.id] = dish.images;
                    }
                });
            })
            .addCase(fetchDishes.rejected, (state, action) => {
                if (action.payload !== 'CANCELLED') {
                    state.loading = false;
                    state.error = action.payload as string;
                }
            })

            .addCase(createDish.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDish.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.dishes.push(action.payload);
                    if (action.payload.id) {
                        state.dishImages[action.payload.id] = action.payload.images || [];
                    }
                }
            })
            .addCase(createDish.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(updateDish.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDish.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const index = state.dishes.findIndex(d => d.id === action.payload.id);
                    if (index !== -1) {
                        state.dishes[index] = action.payload;
                    }
                    if (action.payload.images && action.payload.id) {
                        state.dishImages[action.payload.id] = action.payload.images;
                    }
                }
            })
            .addCase(updateDish.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(deleteDish.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDish.fulfilled, (state, action) => {
                state.loading = false;
                const dishId = action.payload;
                state.dishes = state.dishes.filter(d => d.id !== dishId);
                delete state.dishImages[dishId];
                delete state.dishImageLoading[dishId];
            })
            .addCase(deleteDish.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(fetchDishById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishById.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    const index = state.dishes.findIndex(d => d.id === action.payload.id);
                    if (index !== -1) {
                        state.dishes[index] = action.payload;
                    } else {
                        state.dishes.push(action.payload);
                    }
                    if (action.payload.images && action.payload.id) {
                        state.dishImages[action.payload.id] = action.payload.images;
                    }
                }
            })
            .addCase(fetchDishById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            .addCase(fetchDishImages.pending, (state, action) => {
                const dishId = action.meta.arg.dishId;
                state.dishImageLoading[dishId] = true;
            })
            .addCase(fetchDishImages.fulfilled, (state, action) => {
                const { dishId, images } = action.payload;
                state.dishImages[dishId] = images;
                state.dishImageLoading[dishId] = false;

                const dishIndex = state.dishes.findIndex(d => d.id === dishId);
                if (dishIndex !== -1) {
                    state.dishes[dishIndex].images = images;
                }
            })
            .addCase(fetchDishImages.rejected, (state, action) => {
                const dishId = action.meta.arg.dishId;
                state.dishImageLoading[dishId] = false;
                if (action.payload !== 'CANCELLED') {
                    state.error = action.payload as string;
                }
            })

            .addCase(uploadDishImage.pending, (state, action) => {
                const { dishId } = action.meta.arg;
                state.dishImageLoading[dishId] = true;
            })
            .addCase(uploadDishImage.fulfilled, (state, action) => {
                const { dishId, dish } = action.payload;
                state.dishImageLoading[dishId] = false;

                const index = state.dishes.findIndex(d => d.id === dishId);
                if (index !== -1) {
                    state.dishes[index] = dish;
                }

                if (dish.images && dish.id) {
                    state.dishImages[dishId] = dish.images;
                }
            })
            .addCase(uploadDishImage.rejected, (state, action) => {
                const { dishId } = action.meta.arg;
                state.dishImageLoading[dishId] = false;
                state.error = action.payload as string;
            })

            .addCase(deleteDishImage.pending, (state, action) => {
                const { dishId } = action.meta.arg;
                state.dishImageLoading[dishId] = true;
            })
            .addCase(deleteDishImage.fulfilled, (state, action) => {
                const { dishId, dish } = action.payload;
                state.dishImageLoading[dishId] = false;

                const index = state.dishes.findIndex(d => d.id === dishId);
                if (index !== -1) {
                    state.dishes[index] = dish;
                }

                if (dish.images && dish.id) {
                    state.dishImages[dishId] = dish.images;
                }
            })
            .addCase(deleteDishImage.rejected, (state, action) => {
                const { dishId } = action.meta.arg;
                state.dishImageLoading[dishId] = false;
                state.error = action.payload as string;
            })

            .addCase(deleteAllDishImages.pending, (state, action) => {
                const dishId = action.meta.arg;
                state.dishImageLoading[dishId] = true;
            })
            .addCase(deleteAllDishImages.fulfilled, (state, action) => {
                const { dishId, dish } = action.payload;
                state.dishImageLoading[dishId] = false;

                const index = state.dishes.findIndex(d => d.id === dishId);
                if (index !== -1) {
                    state.dishes[index] = dish;
                }

                state.dishImages[dishId] = dish.images || [];
            })
            .addCase(deleteAllDishImages.rejected, (state, action) => {
                const dishId = action.meta.arg;
                state.dishImageLoading[dishId] = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setFilters,
    clearSelectedRestaurant,
    clearError,
    resetLoading,
    updateRestaurantInList,
    removeRestaurantFromList,
    updateDishInList,
    removeDishFromList,
    clearDishImages,
    updateDishImages,
    setDishImageLoading,
    clearRestaurantImages,
    updateRestaurantImages,
    setRestaurantImageLoading,
} = restaurantsSlice.actions;

export const selectAllRestaurants = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.list;

export const selectSelectedRestaurant = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.selectedRestaurant;

export const selectDishes = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.dishes;

export const selectRestaurantDishes = (state: { restaurants: RestaurantsState }, restaurantId: string) =>
    state.restaurants.dishes.filter(dish => dish.restaurantId === restaurantId);

export const selectDishById = (state: { restaurants: RestaurantsState }, dishId: string) =>
    state.restaurants.dishes.find(dish => dish.id === dishId);

export const selectLoading = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.loading;

export const selectError = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.error;

export const selectFilters = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.filters;

export const selectDishImages = (state: { restaurants: RestaurantsState }, dishId: string) =>
    state.restaurants.dishImages[dishId] || [];

export const selectDishImageUrls = (state: { restaurants: RestaurantsState }, dishId: string) => {
    const images = state.restaurants.dishImages[dishId] || [];
    return images.map(imageName =>
        `http://localhost:8082/api/v1/dishes/${dishId}/images/${encodeURIComponent(imageName)}`
    );
};

export const selectFirstDishImageUrl = (state: { restaurants: RestaurantsState }, dishId: string) => {
    const images = state.restaurants.dishImages[dishId];
    if (images && images.length > 0) {
        return `http://localhost:8082/api/v1/dishes/${dishId}/images/${encodeURIComponent(images[0])}`;
    }
    return null;
};

export const selectAllDishImages = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.dishImages;

export const selectDishImageLoading = (state: { restaurants: RestaurantsState }, dishId: string) =>
    state.restaurants.dishImageLoading[dishId] || false;

export const selectRestaurantImages = (state: { restaurants: RestaurantsState }, restaurantId: string) =>
    state.restaurants.restaurantImages[restaurantId] || [];

export const selectRestaurantImageUrls = (state: { restaurants: RestaurantsState }, restaurantId: string) => {
    const images = state.restaurants.restaurantImages[restaurantId] || [];
    return images.map(imageName =>
        `http://localhost:8082/api/v1/restaurants/${restaurantId}/images/${encodeURIComponent(imageName)}`
    );
};

export const selectFirstRestaurantImageUrl = (state: { restaurants: RestaurantsState }, restaurantId: string) => {
    const images = state.restaurants.restaurantImages[restaurantId];
    if (images && images.length > 0) {
        return `http://localhost:8082/api/v1/restaurants/${restaurantId}/images/${encodeURIComponent(images[0])}`;
    }
    return null;
};

export const selectAllRestaurantImages = (state: { restaurants: RestaurantsState }) =>
    state.restaurants.restaurantImages;

export const selectRestaurantImageLoading = (state: { restaurants: RestaurantsState }, restaurantId: string) =>
    state.restaurants.restaurantImageLoading[restaurantId] || false;

export const getDishImageUrl = (dishId: string, imageName: string) => {
    return `http://localhost:8082/api/v1/dishes/${dishId}/images/${encodeURIComponent(imageName)}`;
};

export const getDishPreviewUrl = (dish: Dish) => {
    if (dish.images && dish.images.length > 0 && dish.id) {
        return `http://localhost:8082/api/v1/dishes/${dish.id}/images/${encodeURIComponent(dish.images[0])}`;
    }
    return null;
};

export const getRestaurantImageUrl = (restaurantId: string, imageName: string) => {
    return `http://localhost:8082/api/v1/restaurants/${restaurantId}/images/${encodeURIComponent(imageName)}`;
};

export const getRestaurantPreviewUrl = (restaurant: Restaurant) => {
    if (restaurant.images && restaurant.images.length > 0 && restaurant.id) {
        return `http://localhost:8082/api/v1/restaurants/${restaurant.id}/images/${encodeURIComponent(restaurant.images[0])}`;
    }
    return null;
};

export default restaurantsSlice.reducer;