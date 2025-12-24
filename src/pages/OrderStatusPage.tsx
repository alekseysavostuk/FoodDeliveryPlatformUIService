import {useEffect, useRef, useState} from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Box,
    Grid,
    CircularProgress,
    Paper,
    Alert,
    Snackbar,
    Avatar,
    Chip,
    Stack,
} from '@mui/material';
import {
    HourglassEmpty,
    RestaurantMenu,
    CheckCircle,
    Schedule,
    LocationOn,
    CreditCard,
    AccountBalance,
    Apple,
    Google,
    Payment as PaymentIcon,
    ArrowForward,
    Image as ImageIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchOrderById } from '../redux/slices/ordersSlice';
import { fetchDishById, fetchRestaurantById } from '../redux/slices/restaurantsSlice';
import type { Address } from '../redux/slices/cartSlice';
import axios from "axios";

const statusConfig: Record<string, { label: string; icon: any }> = {
    NEW: { label: 'Заказ размещен', icon: HourglassEmpty },
    IN_PROGRESS: { label: 'Готовится', icon: RestaurantMenu },
    DONE: { label: 'Доставлен', icon: CheckCircle },
};

const statusColors: Record<string, string> = {
    NEW: '#2196f3',
    IN_PROGRESS: '#ff9800',
    DONE: '#4caf50',
};

const statusSteps: string[] = ['NEW', 'IN_PROGRESS', 'DONE'];

const paymentMethodConfig: Record<string, { label: string; icon: any; color: string }> = {
    CREDIT_CARD: { label: 'Кредитная карта', icon: CreditCard, color: '#1976d2' },
    DEBIT_CARD: { label: 'Дебетовая карта', icon: CreditCard, color: '#1976d2' },
    PAYPAL: { label: 'PayPal', icon: PaymentIcon, color: '#003087' },
    APPLE_PAY: { label: 'Apple Pay', icon: Apple, color: '#000000' },
    GOOGLE_PAY: { label: 'Google Pay', icon: Google, color: '#4285f4' },
    CASH: { label: 'Наличные', icon: AccountBalance, color: '#4caf50' },
};

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    dish_id: string;
}

interface DishWithInfo {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string | null;
    price: number;
    quantity: number;
}

export function OrderStatusPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { currentOrder, loading } = useAppSelector(state => state.orders);
    const cartDeliveryAddress = useAppSelector(state => state.cart.deliveryAddress);
    const { list: allRestaurants } = useAppSelector(state => state.restaurants);

    const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [dishesWithInfo, setDishesWithInfo] = useState<DishWithInfo[]>([]);
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [loadingDishes, setLoadingDishes] = useState(false);
    const [loadingRestaurant, setLoadingRestaurant] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);

    const mountedRef = useRef(true);
    const dishInfoCacheRef = useRef<Record<string, DishWithInfo>>({});
    const restaurantNameCacheRef = useRef<Record<string, string>>({});
    const fetchingDishesRef = useRef<Set<string>>(new Set());
    const fetchingRestaurantsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        mountedRef.current = true;

        if (!id) return;

        const source = axios.CancelToken.source();

        const fetchOrderData = async () => {
            try {
                await dispatch(fetchOrderById({ id, cancelToken: source.token }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    return;
                }
            }
        };

        fetchOrderData();

        const interval = setInterval(() => {
            if (mountedRef.current && id) {
                const refreshSource = axios.CancelToken.source();

                dispatch(fetchOrderById({
                    id,
                    cancelToken: refreshSource.token
                })).catch((error) => {
                    if (!axios.isCancel(error)) {
                    }
                });
            }
        }, 10000);

        setPollingInterval(interval);

        return () => {
            mountedRef.current = false;
            source.cancel('Запрос отменен');
            clearInterval(interval);
        };
    }, [id, dispatch]);

    useEffect(() => {
        if (!id) return;

        const getDeliveryAddress = () => {
            if (cartDeliveryAddress) {
                setDeliveryAddress(cartDeliveryAddress);
                return;
            }

            const addressWithId = localStorage.getItem(`order_${id}_address`);
            if (addressWithId) {
                try {
                    setDeliveryAddress(JSON.parse(addressWithId));
                    return;
                } catch {}
            }

            const lastOrderAddress = localStorage.getItem('last_order_address');
            if (lastOrderAddress) {
                try {
                    setDeliveryAddress(JSON.parse(lastOrderAddress));
                    return;
                } catch {}
            }

            const cartAddressFromStorage = localStorage.getItem('cartDeliveryAddress');
            if (cartAddressFromStorage) {
                try {
                    setDeliveryAddress(JSON.parse(cartAddressFromStorage));
                } catch {}
            }
        };

        getDeliveryAddress();
    }, [id, cartDeliveryAddress]);

    useEffect(() => {
        const loadRestaurantName = async () => {
            if (!currentOrder) return;

            setLoadingRestaurant(true);

            if (currentOrder.restaurantName) {
                setRestaurantName(currentOrder.restaurantName);
                setLoadingRestaurant(false);
                return;
            }

            let restaurantId = currentOrder.restaurantId;

            if (!restaurantId) {
                try {
                    const cart = localStorage.getItem('cart');
                    if (cart) {
                        const cartData = JSON.parse(cart);
                        if (cartData?.length > 0) {
                            restaurantId = cartData[0]?.restaurantId;
                        }
                    }
                } catch {}
            }

            if (restaurantId) {
                if (restaurantNameCacheRef.current[restaurantId]) {
                    setRestaurantName(restaurantNameCacheRef.current[restaurantId]);
                    setLoadingRestaurant(false);
                    return;
                }

                const existingRestaurant = allRestaurants.find(r => r.id === restaurantId);
                if (existingRestaurant) {
                    setRestaurantName(existingRestaurant.name);
                    restaurantNameCacheRef.current[restaurantId] = existingRestaurant.name;
                    setLoadingRestaurant(false);
                    return;
                }

                if (fetchingRestaurantsRef.current.has(restaurantId)) {
                    setLoadingRestaurant(false);
                    return;
                }

                fetchingRestaurantsRef.current.add(restaurantId);

                try {
                    const source = axios.CancelToken.source();
                    const result = await dispatch(fetchRestaurantById({
                        id: restaurantId,
                        cancelToken: source.token
                    })).unwrap() as any;

                    if (result?.name) {
                        setRestaurantName(result.name);
                        restaurantNameCacheRef.current[restaurantId] = result.name;
                    } else {
                        setRestaurantName('Ресторан');
                        restaurantNameCacheRef.current[restaurantId] = 'Ресторан';
                    }
                } catch (error: any) {
                    if (!axios.isCancel(error)) {
                        setRestaurantName('Ресторан');
                        restaurantNameCacheRef.current[restaurantId] = 'Ресторан';
                    }
                } finally {
                    fetchingRestaurantsRef.current.delete(restaurantId);
                }
            } else {
                setRestaurantName('Ресторан');
            }

            setLoadingRestaurant(false);
        };

        if (currentOrder) {
            loadRestaurantName();
        }
    }, [currentOrder, dispatch, allRestaurants]);

    useEffect(() => {
        const loadDishesWithInfo = async () => {
            if (!currentOrder?.items?.length) {
                setDishesWithInfo([]);
                return;
            }

            setLoadingDishes(true);
            const dishes: DishWithInfo[] = [];
            const itemsToFetch: OrderItem[] = [];

            currentOrder.items.forEach((item: OrderItem) => {
                if (item.dish_id) {
                    const cachedDish = dishInfoCacheRef.current[item.dish_id];
                    if (cachedDish) {
                        dishes.push({
                            ...cachedDish,
                            quantity: item.quantity,
                            price: item.price
                        });
                    } else if (!fetchingDishesRef.current.has(item.dish_id)) {
                        fetchingDishesRef.current.add(item.dish_id);
                        itemsToFetch.push(item);
                    }
                }
            });

            if (itemsToFetch.length === 0) {
                setDishesWithInfo(dishes);
                setLoadingDishes(false);
                return;
            }

            try {
                const source = axios.CancelToken.source();
                const promises = itemsToFetch.map(async (item: OrderItem) => {
                    try {
                        const dishData = await dispatch(fetchDishById({
                            dishId: item.dish_id,
                            cancelToken: source.token
                        })).unwrap() as any;

                        const imageUrl = dishData.images?.length > 0
                            ? `http://localhost:8082/api/v1/dishes/${item.dish_id}/images/${encodeURIComponent(dishData.images[0])}`
                            : null;

                        const dishInfo: DishWithInfo = {
                            id: item.dish_id,
                            name: dishData.name || dishData.title || `Блюдо #${item.dish_id.substring(0, 8)}`,
                            description: dishData.description,
                            imageUrl,
                            price: item.price,
                            quantity: item.quantity
                        };

                        dishInfoCacheRef.current[item.dish_id] = {
                            ...dishInfo,
                            quantity: 1,
                            price: dishData.price || item.price
                        };

                        return dishInfo;
                    } catch (error: any) {
                        if (axios.isCancel(error)) {
                            return null;
                        }

                        const dishInfo: DishWithInfo = {
                            id: item.dish_id,
                            name: `Блюдо #${item.dish_id.substring(0, 8)}`,
                            price: item.price,
                            quantity: item.quantity
                        };

                        dishInfoCacheRef.current[item.dish_id] = {
                            ...dishInfo,
                            quantity: 1,
                            price: item.price
                        };

                        return dishInfo;
                    } finally {
                        fetchingDishesRef.current.delete(item.dish_id);
                    }
                });

                const fetchedDishes = (await Promise.all(promises)).filter(Boolean) as DishWithInfo[];

                const allDishes = [...dishes, ...fetchedDishes];

                currentOrder.items.forEach((item: OrderItem) => {
                    if (item.dish_id && !allDishes.find(d => d.id === item.dish_id)) {
                        const cachedDish = dishInfoCacheRef.current[item.dish_id];
                        if (cachedDish) {
                            allDishes.push({
                                ...cachedDish,
                                quantity: item.quantity,
                                price: item.price
                            });
                        }
                    }
                });

                setDishesWithInfo(allDishes);
            } catch (error) {
                if (!axios.isCancel(error)) {
                }
            } finally {
                setLoadingDishes(false);
            }
        };

        const timer = setTimeout(() => {
            loadDishesWithInfo();
        }, 50);

        return () => {
            clearTimeout(timer);
        };
    }, [currentOrder, dispatch]);

    useEffect(() => {
        if (currentOrder && ['DONE', 'DELIVERED', 'COMPLETED'].includes(currentOrder.status as string)) {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
            }
        }
    }, [currentOrder, pollingInterval]);

    const handlePaymentClick = () => {
        if (!id) {
            setError('ID заказа не найден');
            setShowError(true);
            return;
        }

        if (!currentOrder) {
            setError('Заказ не найден');
            setShowError(true);
            return;
        }

        if (currentOrder.status === 'DONE') {
            setError('Этот заказ уже завершен');
            setShowError(true);
            return;
        }

        navigate(`/payment/${id}`);
    };

    const formatAddress = (address: Address | null) => {
        if (!address) return 'Адрес не указан';
        return [address.street, address.city, address.zip, address.state, address.country].filter(Boolean).join(', ');
    };

    const formatDate = (dateString: string | Date) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Дата не указана';
            return date.toLocaleString('ru-RU');
        } catch {
            return 'Дата не указана';
        }
    };

    const getOrderDate = () => {
        if (!currentOrder) return 'Дата не указана';

        if ('orderDate' in currentOrder && currentOrder.orderDate) {
            return currentOrder.orderDate as string;
        } else if ('createdAt' in currentOrder && currentOrder.createdAt) {
            return currentOrder.createdAt as string;
        } else if ('createdDate' in currentOrder && currentOrder.createdDate) {
            return currentOrder.createdDate as string;
        }

        return 'Дата не указана';
    };

    const getPaymentStatus = () => {
        if (currentOrder?.payment?.id) {
            return {
                label: 'Оплачен',
                color: '#4caf50',
                method: currentOrder.payment.method,
                amount: currentOrder.payment.amount,
                status: 'PAID',
                icon: CheckCircle
            };
        }

        return {
            label: 'Не оплачен',
            color: '#ff9800',
            method: null,
            amount: null,
            status: 'UNPAID',
            icon: Schedule
        };
    };

    const getPaymentMethodInfo = (method: string) => {
        return paymentMethodConfig[method] || {
            label: method,
            icon: PaymentIcon,
            color: '#757575'
        };
    };

    const handleCloseError = () => {
        setShowError(false);
    };

    if (loading && !currentOrder) {
        return (
            <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!currentOrder) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Заказ не найден
                    </Typography>
                    <Button component={RouterLink} to="/orders" variant="contained">
                        Перейти к списку заказов
                    </Button>
                </Paper>
            </Container>
        );
    }

    const activeStep = statusSteps.indexOf(currentOrder.status as string);
    const StatusIcon = statusConfig[currentOrder.status]?.icon || Schedule;
    const paymentStatus = getPaymentStatus();
    const paymentMethodInfo = paymentStatus.method ? getPaymentMethodInfo(paymentStatus.method) : null;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Заказ #{currentOrder.id.substring(0, 8)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Оформлен {formatDate(getOrderDate())}
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: `${statusColors[currentOrder.status] || '#757575'}15`,
                            color: statusColors[currentOrder.status] || '#757575',
                        }}>
                            <StatusIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6">
                                {statusConfig[currentOrder.status]?.label || 'Неизвестный статус'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Текущий статус вашего заказа
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Ресторан:
                        </Typography>
                        {loadingRestaurant ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body1">Загрузка...</Typography>
                            </Box>
                        ) : (
                            <Typography variant="h6">
                                {restaurantName}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                        p: 2,
                        bgcolor: `${paymentStatus.color}15`,
                        borderRadius: 2,
                        border: `1px solid ${paymentStatus.color}30`
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: paymentStatus.color,
                                color: 'white',
                            }}>
                                <paymentStatus.icon sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    {paymentStatus.label}
                                </Typography>
                                {paymentStatus.status === 'PAID' && paymentMethodInfo ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        {paymentMethodInfo.icon && (
                                            <paymentMethodInfo.icon
                                                sx={{
                                                    fontSize: 18,
                                                    color: paymentMethodInfo.color
                                                }}
                                            />
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            {paymentMethodInfo.label} • {paymentStatus.amount} ₽
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Для завершения заказа требуется оплата
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {paymentStatus.status === 'UNPAID' && (
                            <Button
                                variant="contained"
                                endIcon={<ArrowForward />}
                                onClick={handlePaymentClick}
                                sx={{
                                    bgcolor: paymentStatus.color,
                                    '&:hover': {
                                        bgcolor: paymentStatus.color,
                                        opacity: 0.9
                                    }
                                }}
                            >
                                Оплатить заказ
                            </Button>
                        )}
                    </Box>

                    {statusSteps.includes(currentOrder.status as string) && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Прогресс заказа:
                            </Typography>

                            <Box sx={{ position: 'relative', width: '100%', mt: 4 }}>
                                <Box sx={{
                                    position: 'absolute',
                                    top: 20,
                                    left: '10%',
                                    right: '10%',
                                    height: 3,
                                    bgcolor: 'grey.300',
                                    zIndex: 0,
                                }} />

                                {activeStep >= 0 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 20,
                                        left: '10%',
                                        right: '10%',
                                        height: 3,
                                        bgcolor: statusColors[statusSteps[activeStep]],
                                        zIndex: 1,
                                        width: `${(activeStep / (statusSteps.length - 1)) * 80}%`,
                                    }} />
                                )}

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    zIndex: 2,
                                }}>
                                    {statusSteps.map((step, index) => {
                                        const Icon = statusConfig[step]?.icon;
                                        const isActive = index <= activeStep;
                                        const isCurrent = index === activeStep;
                                        const stepLabel = step === 'NEW' ? 'Размещен' :
                                            step === 'IN_PROGRESS' ? 'Готовится' : 'Доставлен';

                                        return (
                                            <Box key={step} sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '33.33%',
                                            }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: isActive ? statusColors[step] : 'grey.300',
                                                    color: isActive ? 'white' : 'grey.500',
                                                    mb: 1,
                                                    position: 'relative',
                                                }}>
                                                    {Icon && <Icon />}
                                                    {isCurrent && (
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            top: -2,
                                                            right: -2,
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '50%',
                                                            bgcolor: statusColors[step],
                                                            border: '2px solid white',
                                                        }} />
                                                    )}
                                                </Box>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        textAlign: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: isCurrent ? 'bold' : 'normal',
                                                        maxWidth: 60,
                                                    }}
                                                >
                                                    {stepLabel}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Детали заказа
                    </Typography>

                    <Grid container spacing={2}>
                        {deliveryAddress && (
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <LocationOn sx={{ color: 'text.secondary', mt: 0.5 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Адрес доставки
                                        </Typography>
                                        <Typography>
                                            {formatAddress(deliveryAddress)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Сумма заказа
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    {currentOrder.totalPrice.toFixed(2)} ₽
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Блюда в заказе
                    </Typography>

                    {loadingDishes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                                Загрузка информации о блюдах...
                            </Typography>
                        </Box>
                    ) : dishesWithInfo.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ p: 4 }}>
                            Информация о блюдах отсутствует
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            {dishesWithInfo.map((dish, index) => (
                                <Box
                                    key={dish.id || index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 2,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <Box sx={{ mr: 2, position: 'relative' }}>
                                        {dish.imageUrl ? (
                                            <Avatar
                                                src={dish.imageUrl}
                                                alt={dish.name}
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 1,
                                                }}
                                                variant="rounded"
                                            />
                                        ) : (
                                            <Avatar
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.500',
                                                }}
                                                variant="rounded"
                                            >
                                                <ImageIcon sx={{ fontSize: 30 }} />
                                            </Avatar>
                                        )}
                                        <Chip
                                            label={`×${dish.quantity}`}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: -6,
                                                right: -6,
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                height: 20,
                                                minWidth: 20,
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {dish.name}
                                        </Typography>
                                        {dish.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 0.5,
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {dish.description}
                                            </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {dish.price.toFixed(2)} ₽ × {dish.quantity}
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {(dish.price * dish.quantity).toFixed(2)} ₽
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    )}

                    {dishesWithInfo.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 3,
                            pt: 2,
                            borderTop: 1,
                            borderColor: 'divider'
                        }}>
                            <Typography variant="h6">
                                Итого:
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                                {currentOrder.totalPrice.toFixed(2)} ₽
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button component={RouterLink} to="/orders" variant="outlined">
                    Мои заказы
                </Button>
                <Button component={RouterLink} to="/" variant="contained">
                    Новый заказ
                </Button>
            </Box>

            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
}