import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Chip,
    Pagination,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    type SelectChangeEvent,
    Alert,
    Avatar,
    Snackbar,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    ShoppingBag,
    AccessTime,
    Restaurant,
    CheckCircle,
    HourglassEmpty,
    RestaurantMenu,
    Payment as PaymentIcon,
    CreditCard,
    AccountBalance,
    Apple,
    Google,
    Update as UpdateIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchUserOrders, updateOrderStatus } from '../../redux/slices/ordersSlice';
import { fetchUserById } from '../../redux/slices/profileSlice';
import axios from "axios";

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

const nextStatusMap: Record<string, string> = {
    NEW: 'IN_PROGRESS',
    IN_PROGRESS: 'DONE',
    PENDING: 'NEW',
};

export function AdminUserOrdersPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { list: orders, loading } = useAppSelector(state => state.orders);
    const { selectedUser } = useAppSelector(state => state.profile);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortedOrders, setSortedOrders] = useState<any[]>([]);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    const mountedRef = useRef(true);
    const loadedUserIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        mountedRef.current = true;

        if (!id) return;

        const fetchData = async () => {
            if (loadedUserIds.current.has(id)) {
                try {
                    const source = axios.CancelToken.source();
                    await dispatch(fetchUserOrders({ userId: id, cancelToken: source.token }));
                } catch (error) {
                    if (!axios.isCancel(error)) {
                        console.error('Ошибка загрузки заказов:', error);
                    }
                }
                return;
            }

            loadedUserIds.current.add(id);

            const source = axios.CancelToken.source();

            try {
                await Promise.all([
                    dispatch(fetchUserById({
                        id: id,
                        cancelToken: source.token
                    }))
                ]);
            } catch (error) {
                if (axios.isCancel(error)) {
                    loadedUserIds.current.delete(id);
                    return;
                }
                loadedUserIds.current.delete(id);
                console.error('Ошибка загрузки данных:', error);
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (orders.length > 0) {
            const sorted = [...orders].sort((a, b) => {
                const dateA = new Date(a.orderDate).getTime();
                const dateB = new Date(b.orderDate).getTime();
                return dateB - dateA;
            });
            setSortedOrders(sorted);
        }
    }, [orders]);

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

    const handleUpdateOrderStatus = async (order: any) => {
        try {
            const source = axios.CancelToken.source();
            await dispatch(updateOrderStatus({
                orderId: order.id,
                cancelToken: source.token
            })).unwrap();

            setSnackbar({
                open: true,
                message: 'Статус обновлен',
                severity: 'success',
            });

            if (id) {
                const source = axios.CancelToken.source();
                await dispatch(fetchUserOrders({
                    userId: id,
                    cancelToken: source.token
                }));
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: 'Ошибка при изменении статуса',
                severity: 'error',
            });
        }
    };

    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
        const newItemsPerPage = Number(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    if (loading && orders.length === 0) {
        return (
            <Container maxWidth="lg" sx={{
                py: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh'
            }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!selectedUser) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Пользователь не найден
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ mt: 2 }}
                >
                    Назад к списку пользователей
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/users')}
                sx={{ mb: 4 }}
            >
                Назад к списку пользователей
            </Button>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Заказы пользователя: {selectedUser.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Email: {selectedUser.email}
                    </Typography>
                </Box>
            </Box>

            {orders.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        У пользователя пока нет заказов
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Этот пользователь еще не делал заказов
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                            Все заказы ({orders.length})
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Всего заказов: {orders.length}
                            </Typography>

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id="items-per-page-label">На странице</InputLabel>
                                <Select
                                    labelId="items-per-page-label"
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
                            const paymentStatus = getPaymentStatus(order);
                            const paymentMethodInfo = paymentStatus.method ? getPaymentMethodInfo(paymentStatus.method) : null;
                            const canUpdate = nextStatusMap[order.status] !== undefined;

                            return (
                                <Card key={order.id} elevation={1}>
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

                                                {order.restaurantName && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {order.restaurantName}
                                                    </Typography>
                                                )}
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

                                        {canUpdate && (
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<UpdateIcon />}
                                                    onClick={() => handleUpdateOrderStatus(order)}
                                                >
                                                    Обновить статус
                                                </Button>
                                            </Box>
                                        )}
                                    </CardContent>
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
                </>
            )}
        </Container>
    );
}