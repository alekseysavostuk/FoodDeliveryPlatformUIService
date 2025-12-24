import {useEffect, useRef, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Box,
    Grid,
    CircularProgress,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import {
    CreditCard,
    AccountBalance,
    Apple,
    Google,
    Payment as PaymentIcon,
    CheckCircle,
    ArrowBack,
    LocalShipping,
} from '@mui/icons-material';
import { createPayment, fetchOrderById } from '../redux/slices/ordersSlice';
import type { AppDispatch, RootState } from '../redux/store';
import axios from "axios";

const DELIVERY_FEE = 149;

interface OrderData {
    orderId?: string;
    total?: number;
    subtotal?: number;
    restaurantId?: string;
    items?: any[];
    address?: {
        street?: string;
        city?: string;
        zip?: string;
        state?: string;
    };
}

export function PaymentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [localStorageError, setLocalStorageError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);

    const {
        currentOrder,
        paymentLoading,
        paymentError,
    } = useSelector((state: RootState) => state.orders);

    useEffect(() => {
        const loadOrderData = async () => {
            if (!id) {
                setLocalStorageError('ID заказа не найден в URL');
                setShowError(true);
                setLoading(false);
                return;
            }

            try {
                const pendingOrder = localStorage.getItem('pending_payment_order');

                if (pendingOrder) {
                    try {
                        const parsedData = JSON.parse(pendingOrder);
                        if (parsedData.orderId === id) {
                            setOrderData(parsedData);
                            setLoading(false);
                            return;
                        } else {
                            setOrderData(parsedData);
                        }
                    } catch {
                        setLocalStorageError('Ошибка при чтении данных заказа');
                        setShowError(true);
                    }
                }

                const mountedRef = useRef(true);

                useEffect(() => {
                    mountedRef.current = true;

                    const fetchOrder = async () => {
                        if (!id) return;

                        const source = axios.CancelToken.source();

                        try {
                            await dispatch(fetchOrderById({
                                id,
                                cancelToken: source.token
                            })).unwrap();
                            setLoading(false);
                        } catch (error) {
                            if (axios.isCancel(error)) {
                                return;
                            }
                            setLocalStorageError('Не удалось загрузить данные заказа');
                            setShowError(true);
                            setLoading(false);
                        }
                    };

                    fetchOrder();

                    return () => {
                        mountedRef.current = false;
                    };
                }, [id, dispatch]);
            } catch {
                setLocalStorageError('Произошла непредвиденная ошибка');
                setShowError(true);
                setLoading(false);
            }
        };

        loadOrderData();
    }, [id, dispatch]);

    useEffect(() => {
        if (currentOrder && currentOrder.id === id) {
            const address = JSON.parse(localStorage.getItem(`order_${id}_address`) || 'null') ||
                JSON.parse(localStorage.getItem('last_order_address') || 'null');

            setOrderData({
                orderId: currentOrder.id,
                total: currentOrder.totalPrice,
                restaurantId: currentOrder.restaurantId,
                items: currentOrder.items,
                address
            });
        }
    }, [currentOrder, id]);

    const calculateFinalTotal = () => {
        if (!orderData) return 0;
        const subtotal = orderData.subtotal || orderData.total || 0;
        return subtotal + DELIVERY_FEE;
    };

    const finalTotal = calculateFinalTotal();

    const handlePayment = async () => {
        if (!id) {
            alert('ID заказа не найден');
            return;
        }

        try {
            await dispatch(createPayment({
                id,
                paymentMethod
            })).unwrap();

            localStorage.removeItem('pending_payment_order');

            navigate(`/order/${id}`, {
                state: {
                    paymentSuccess: true,
                }
            });

        } catch (error: any) {
            const errorMessage = error?.message ||
                error?.payload ||
                error?.toString() ||
                'Ошибка при оплате. Проверьте выбранный способ оплаты.';

            alert(`Ошибка оплаты: ${errorMessage}`);
        }
    };

    const handleCloseError = () => {
        setShowError(false);
    };

    const handleBack = () => {
        if (!orderData) {
            navigate('/cart');
        } else {
            navigate(-1);
        }
    };

    const renderPaymentMethodOption = (value: string, label: string, Icon: any) => (
        <FormControlLabel
            value={value}
            control={<Radio />}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon />
                    <Typography>{label}</Typography>
                </Box>
            }
        />
    );

    const formatAddress = () => {
        if (!orderData?.address) return null;

        const { street, city, zip, state } = orderData.address;
        const parts = [street, city, zip, state].filter(Boolean);
        return parts.join(', ');
    };

    if (loading) {
        return (
            <Container sx={{
                py: 8,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                flexDirection: 'column'
            }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>
                    Загрузка данных заказа...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    ID заказа: {id}
                </Typography>
            </Container>
        );
    }

    if (!orderData) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Не удалось загрузить данные заказа #{id}
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => navigate('/orders')}
                    sx={{ mr: 2 }}
                >
                    Перейти к моим заказам
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/cart')}
                >
                    Вернуться в корзину
                </Button>
            </Container>
        );
    }

    const displayOrderId = orderData.orderId?.substring(0, 8) || id?.substring(0, 8) || 'N/A';
    const displayTotal = orderData.total?.toFixed(2) || '0.00';

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ mb: 3 }}
            >
                Вернуться назад
            </Button>

            <Typography variant="h4" gutterBottom>
                Оплата заказа #{displayOrderId}
            </Typography>

            {paymentError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {paymentError}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Детали заказа
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <List disablePadding>
                                    <ListItem disableGutters sx={{ py: 0.5 }}>
                                        <ListItemText primary="Стоимость товаров" />
                                        <Typography variant="body2">
                                            {displayTotal} ₽
                                        </Typography>
                                    </ListItem>

                                    <ListItem disableGutters sx={{ py: 0.5 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocalShipping fontSize="small" />
                                                    Доставка
                                                </Box>
                                            }
                                        />
                                        <Typography variant="body2">
                                            {DELIVERY_FEE.toFixed(2)} ₽
                                        </Typography>
                                    </ListItem>

                                    <Divider sx={{ my: 1 }} />

                                    <ListItem disableGutters sx={{ py: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Итого к оплате
                                                </Typography>
                                            }
                                        />
                                        <Typography variant="h5" color="primary" fontWeight="bold">
                                            {finalTotal.toFixed(2)} ₽
                                        </Typography>
                                    </ListItem>
                                </List>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {orderData.address ? (
                                <>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Адрес доставки:
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatAddress()}
                                    </Typography>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Адрес доставки не указан
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Способ оплаты
                            </Typography>

                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    {renderPaymentMethodOption('CREDIT_CARD', 'Кредитная карта', CreditCard)}
                                    {renderPaymentMethodOption('DEBIT_CARD', 'Дебетовая карта', CreditCard)}
                                    {renderPaymentMethodOption('PAYPAL', 'PayPal', PaymentIcon)}
                                    {renderPaymentMethodOption('APPLE_PAY', 'Apple Pay', Apple)}
                                    {renderPaymentMethodOption('GOOGLE_PAY', 'Google Pay', Google)}
                                    {renderPaymentMethodOption('CASH', 'Наличные', AccountBalance)}
                                </RadioGroup>
                            </FormControl>

                            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Сумма к оплате:
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {finalTotal.toFixed(2)} ₽
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={handlePayment}
                                disabled={paymentLoading}
                                startIcon={paymentLoading ? <CircularProgress size={20} /> : <CheckCircle />}
                                sx={{ mt: 2 }}
                            >
                                {paymentLoading ? 'Обработка платежа...' : `Оплатить ${finalTotal.toFixed(2)} ₽`}
                            </Button>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: 'center', display: 'block' }}>
                                Нажимая кнопку, вы соглашаетесь с условиями обработки платежей
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {localStorageError}
                </Alert>
            </Snackbar>
        </Container>
    );
}