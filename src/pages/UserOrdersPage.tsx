import {useEffect, useRef, useState, useCallback} from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Button,
    Box,
    Grid,
    CircularProgress,
    Paper,
    Chip,
    Pagination,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    ShoppingBag,
    AccessTime,
    Restaurant,
    CheckCircle,
    LocationOn,
    HourglassEmpty,
    RestaurantMenu,
    Payment as PaymentIcon,
    CreditCard,
    AccountBalance,
    Apple,
    Google
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchUserOrders } from '../redux/slices/ordersSlice';
import { fetchRestaurantById } from '../redux/slices/restaurantsSlice';
import axios from "axios";

interface Address {
    id?: string;
    street: string;
    city: string;
    zip?: string;
    state?: string;
    country?: string;
    apartment?: string;
    floor?: string;
    entrance?: string;
    intercom?: string;
    [key: string]: any;
}

const orderStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
    NEW: { label: 'Размещен', icon: HourglassEmpty, color: '#2196f3' },
    IN_PROGRESS: { label: 'Готовится', icon: RestaurantMenu, color: '#ff9800' },
    DONE: { label: 'Доставлен', icon: CheckCircle, color: '#4caf50' }
};

const paymentMethodConfig: Record<string, { label: string; icon: any; color: string }> = {
    CREDIT_CARD: { label: 'Кредитная карта', icon: CreditCard, color: '#1976d2' },
    DEBIT_CARD: { label: 'Дебетовая карта', icon: CreditCard, color: '#1976d2' },
    PAYPAL: { label: 'PayPal', icon: PaymentIcon, color: '#003087' },
    APPLE_PAY: { label: 'Apple Pay', icon: Apple, color: '#000000' },
    GOOGLE_PAY: { label: 'Google Pay', icon: Google, color: '#4285f4' },
    CASH: { label: 'Наличные', icon: AccountBalance, color: '#4caf50' },
};

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const restaurantNameCache: Record<string, string> = {};
const loadedOrdersUsers = new Set<string>();

export function UserOrdersPage() {
    const dispatch = useAppDispatch();
    const { list: orders, loading } = useAppSelector(state => state.orders);
    const { user } = useAppSelector(state => state.auth);
    const { list: allRestaurants } = useAppSelector(state => state.restaurants);

    const [addresses, setAddresses] = useState<Record<string, Address | null>>({});
    const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortedOrders, setSortedOrders] = useState<any[]>([]);
    const [loadingRestaurantNames, setLoadingRestaurantNames] = useState<boolean>(false);

    const mountedRef = useRef(true);
    const fetchingRestaurantsRef = useRef<Set<string>>(new Set());
    const lastUserIdRef = useRef<string>('');

    useEffect(() => {
        mountedRef.current = true;

        const fetchOrders = async () => {
            if (!user?.id) return;

            if (lastUserIdRef.current === user.id && orders.length > 0) {
                return;
            }

            if (loadedOrdersUsers.has(user.id)) {
                return;
            }

            loadedOrdersUsers.add(user.id);
            lastUserIdRef.current = user.id;

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchUserOrders({
                    userId: user.id,
                    cancelToken: source.token
                }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    loadedOrdersUsers.delete(user.id);
                    return;
                }
                console.error('Ошибка загрузки заказов:', error);
                loadedOrdersUsers.delete(user.id);
            }
        };

        fetchOrders();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, user?.id]);

    useEffect(() => {
        if (orders.length === 0) return;

        const sorted = [...orders].sort((a, b) => {
            const dateA = new Date(a.orderDate).getTime();
            const dateB = new Date(b.orderDate).getTime();
            return dateB - dateA;
        });
        setSortedOrders(sorted);

        const addressesMap: Record<string, Address | null> = {};
        const restaurantNamesMap: Record<string, string> = { ...restaurantNames };
        const missingRestaurantIds: Set<string> = new Set();

        orders.forEach(order => {

            let address: Address | null = null;
            const addressWithId = localStorage.getItem(`order_${order.id}_address`);
            if (addressWithId) {
                try {
                    address = JSON.parse(addressWithId);
                } catch {}
            }

            if (!address) {
                const lastOrderAddress = localStorage.getItem('last_order_address');
                if (lastOrderAddress) {
                    try {
                        address = JSON.parse(lastOrderAddress);
                    } catch {}
                }
            }

            if (!address) {
                const cartAddressFromStorage = localStorage.getItem('cartDeliveryAddress');
                if (cartAddressFromStorage) {
                    try {
                        address = JSON.parse(cartAddressFromStorage);
                    } catch {}
                }
            }

            addressesMap[order.id] = address;

            if (order.restaurantName) {
                restaurantNamesMap[order.id] = order.restaurantName;
                if (order.restaurantId) {
                    restaurantNameCache[order.restaurantId] = order.restaurantName;
                }
            } else if (order.restaurantId) {

                if (restaurantNameCache[order.restaurantId]) {
                    restaurantNamesMap[order.id] = restaurantNameCache[order.restaurantId];
                } else {

                    const restaurant = allRestaurants.find(r => r.id === order.restaurantId);
                    if (restaurant) {
                        restaurantNamesMap[order.id] = restaurant.name;
                        restaurantNameCache[order.restaurantId] = restaurant.name;
                    } else {
                        try {
                            const cart = localStorage.getItem('cart');
                            if (cart) {
                                const cartData = JSON.parse(cart);
                                if (cartData?.length > 0) {
                                    const cartItem = cartData.find((item: any) =>
                                        item.restaurantId === order.restaurantId
                                    );
                                    if (cartItem?.restaurantName) {
                                        restaurantNamesMap[order.id] = cartItem.restaurantName;
                                        restaurantNameCache[order.restaurantId] = cartItem.restaurantName;
                                        return;
                                    }
                                }
                            }
                        } catch {}

                        if (!fetchingRestaurantsRef.current.has(order.restaurantId)) {

                            const cacheKey = `404_${order.restaurantId}`;
                            const is404Cached = localStorage.getItem(cacheKey);

                            if (!is404Cached) {
                                missingRestaurantIds.add(order.restaurantId);
                            } else {
                                restaurantNamesMap[order.id] = 'Ресторан';
                                restaurantNameCache[order.restaurantId] = 'Ресторан';
                            }
                        }
                    }
                }
            }
        });

        setAddresses(addressesMap);
        setRestaurantNames(restaurantNamesMap);

        if (missingRestaurantIds.size > 0) {
            loadMissingRestaurantNames(Array.from(missingRestaurantIds), orders, restaurantNamesMap);
        }
    }, [orders, allRestaurants]);

    const loadMissingRestaurantNames = useCallback(async (
        restaurantIds: string[],
        ordersList: any[],
        currentRestaurantNames: Record<string, string>
    ) => {
        if (!mountedRef.current || restaurantIds.length === 0) return;

        setLoadingRestaurantNames(true);

        const source = axios.CancelToken.source();
        const uniqueIds = [...new Set(restaurantIds)];

        uniqueIds.forEach(id => fetchingRestaurantsRef.current.add(id));

        try {
            const updatedRestaurantNames = { ...currentRestaurantNames };

            for (const restaurantId of uniqueIds) {
                if (!mountedRef.current) break;

                try {
                    const result = await dispatch(fetchRestaurantById({
                        id: restaurantId,
                        cancelToken: source.token
                    })).unwrap();

                    if (result?.name) {

                        restaurantNameCache[restaurantId] = result.name;

                        ordersList.forEach(order => {
                            if (order.restaurantId === restaurantId) {
                                updatedRestaurantNames[order.id] = result.name;
                            }
                        });
                    }
                } catch (error: any) {
                    if (axios.isCancel(error)) {
                        continue;
                    }

                    if (error.response?.status === 404) {
                        console.log(`Ресторан ${restaurantId} не найден`);

                        const cacheKey = `404_${restaurantId}`;
                        localStorage.setItem(cacheKey, 'true');
                        setTimeout(() => {
                            localStorage.removeItem(cacheKey);
                        }, 5 * 60 * 1000);

                        restaurantNameCache[restaurantId] = 'Ресторан';
                        ordersList.forEach(order => {
                            if (order.restaurantId === restaurantId) {
                                updatedRestaurantNames[order.id] = 'Ресторан';
                            }
                        });
                    }
                } finally {
                    fetchingRestaurantsRef.current.delete(restaurantId);
                }
            }

            if (mountedRef.current) {
                setRestaurantNames(updatedRestaurantNames);
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error('Ошибка загрузки ресторанов:', error);
            }
        } finally {
            if (mountedRef.current) {
                setLoadingRestaurantNames(false);
            }
        }

        return () => {
            source.cancel('Запрос отменен');
        };
    }, [dispatch]);

    const formatAddress = (address: Address | null) => {
        if (!address) return 'Адрес не указан';

        if (typeof address === 'string') {
            return address;
        }

        const parts = [
            address.street,
            address.apartment ? `кв. ${address.apartment}` : '',
            address.city,
            address.zip,
            address.state,
            address.country
        ].filter(Boolean);

        return parts.join(', ');
    };

    const formatOrderDate = (order: any) => {
        if (!order.orderDate) return 'Дата не указана';

        const date = new Date(order.orderDate);
        return isNaN(date.getTime()) ? 'Дата не указана' : date.toLocaleString('ru-RU');
    };

    const getOrderStatus = (status: string) => {
        return orderStatusConfig[status] || { label: status, icon: null, color: '#757575' };
    };

    const getPaymentMethodInfo = (method: string) => {
        return paymentMethodConfig[method] || { label: method, icon: PaymentIcon, color: '#757575' };
    };

    const getPaymentStatus = (order: any) => {
        if (order.payment && order.payment.id) {
            return {
                label: 'Оплачен',
                color: '#4caf50',
                method: order.payment.method,
                amount: order.payment.amount,
                status: 'PAID'
            };
        }

        return {
            label: 'Не оплачен',
            color: '#ff9800',
            method: null,
            amount: null,
            status: 'UNPAID'
        };
    };

    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (event: any) => {
        const newItemsPerPage = Number(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    if (loading) {
        return (
            <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (orders.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Мои заказы
                </Typography>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        У вас пока нет заказов
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Закажите что-нибудь вкусное!
                    </Typography>
                    <Button component={RouterLink} to="/" variant="contained" size="large">
                        Перейти к ресторанам
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                    Мои заказы
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Всего заказов: {orders.length}
                    </Typography>

                    {loadingRestaurantNames && (
                        <CircularProgress size={20} />
                    )}

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>На странице</InputLabel>
                        <Select
                            value={itemsPerPage}
                            label="На странице"
                            onChange={handleItemsPerPageChange}
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3, mb: 4 }}>
                {currentOrders.map(order => {
                    const status = getOrderStatus(order.status.toString());
                    const StatusIcon = status.icon;
                    const address = addresses[order.id];
                    const restaurantName = restaurantNames[order.id] || order.restaurantName || 'Ресторан';
                    const paymentStatus = getPaymentStatus(order);
                    const paymentMethodInfo = paymentStatus.method ? getPaymentMethodInfo(paymentStatus.method) : null;

                    return (
                        <Card key={order.id}>
                            <CardActionArea component={RouterLink} to={`/order/${order.id}`}>
                                <CardContent>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        mb: 2
                                    }}>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                Заказ #{order.id.substring(0, 8)}
                                            </Typography>

                                            <Typography variant="subtitle1" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                                                {restaurantName}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={status.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${status.color}15`,
                                                        color: status.color,
                                                        fontWeight: 'medium',
                                                        fontSize: '0.75rem',
                                                        height: 24
                                                    }}
                                                />
                                                {StatusIcon && (
                                                    <StatusIcon
                                                        sx={{
                                                            fontSize: 18,
                                                            color: status.color
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={paymentStatus.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${paymentStatus.color}15`,
                                                        color: paymentStatus.color,
                                                        fontWeight: 'medium',
                                                        fontSize: '0.75rem',
                                                        height: 24
                                                    }}
                                                />
                                                {paymentStatus.status === 'PAID' && paymentMethodInfo && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {paymentMethodInfo.icon && (
                                                            <paymentMethodInfo.icon
                                                                sx={{
                                                                    fontSize: 16,
                                                                    color: paymentMethodInfo.color
                                                                }}
                                                            />
                                                        )}
                                                        <Typography variant="caption" color="text.secondary">
                                                            {paymentMethodInfo.label}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" color="primary">
                                                {order.totalPrice.toFixed ? order.totalPrice.toFixed(2) : order.totalPrice} ₽
                                            </Typography>
                                            {paymentStatus.status === 'PAID' && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Оплачено: {paymentStatus.amount} ₽
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AccessTime sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatOrderDate(order)}
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Restaurant sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {order.items.length} {order.items.length === 1 ? 'блюдо' : 'блюд'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{
                                        mt: 2,
                                        pt: 2,
                                        borderTop: 1,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1
                                    }}>
                                        <LocationOn sx={{
                                            fontSize: 20,
                                            color: 'text.secondary',
                                            mt: 0.25
                                        }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Адрес доставки:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {formatAddress(address)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    );
                })}
            </Box>

            {totalPages > 1 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mt: 4,
                        display: 'flex',
                        justifyContent: 'center',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2
                    }}
                >
                    <Stack spacing={2} alignItems="center">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                        />

                        <Typography variant="body2" color="text.secondary">
                            Показано {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedOrders.length)} из {sortedOrders.length} заказов
                        </Typography>
                    </Stack>
                </Paper>
            )}
        </Container>
    );
}