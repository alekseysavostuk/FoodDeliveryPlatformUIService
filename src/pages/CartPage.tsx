import {useEffect, useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    Box,
    Grid,
    IconButton,
    TextField,
    Paper,
    Divider,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import { Delete, Add, Remove, ShoppingBag, AddLocation, LocationOn, Payment, Login } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { updateQuantity, removeFromCart, clearCart, setDeliveryAddress } from '../redux/slices/cartSlice';
import { createOrder } from '../redux/slices/ordersSlice';
import { fetchAddresses, addAddress } from '../redux/slices/profileSlice';
import axios from "axios";

const CART_STORAGE_KEY = 'cart';
const CART_RESTAURANT_KEY = 'cartRestaurantId';
const CART_DELIVERY_KEY = 'cartDeliveryAddress';

export function CartPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { items, restaurantId } = useAppSelector(state => state.cart);
    const { user } = useAppSelector(state => state.auth);
    const { addresses } = useAppSelector(state => state.profile);

    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showClearCartDialog, setShowClearCartDialog] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        zip: '',
        state: '',
        country: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const source = axios.CancelToken.source();

        const fetchData = async () => {
            if (!user) return;

            try {
                await dispatch(fetchAddresses({ userId: user.id, cancelToken: source.token }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    return;
                }
                console.error('Ошибка загрузки:', error);
            }
        };

        if (user) {
            fetchData();
        }

        return () => {
            mountedRef.current = false;
            source.cancel('Запрос отменен');
        };
    }, [user, dispatch]);

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddress = addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            } else {
                setSelectedAddressId(addresses[0].id);
            }
        }
    }, [addresses, selectedAddressId]);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = items.length > 0 ? 149 : 0;
    const total = subtotal + deliveryFee;

    const getSelectedAddressText = () => {
        if (!selectedAddressId) return '';
        const selected = addresses.find(addr => addr.id === selectedAddressId);
        if (!selected) return '';

        return `${selected.street}, ${selected.city}, ${selected.zip}${selected.state ? `, ${selected.state}` : ''}, ${selected.country}`;
    };

    const handleUpdateQuantity = (dishId: string, quantity: number) => {
        dispatch(updateQuantity({ dishId, quantity }));
    };

    const handleRemove = (dishId: string) => {
        dispatch(removeFromCart(dishId));
    };

    const handleClearCart = () => {
        setShowClearCartDialog(true);
    };

    const confirmClearCart = () => {
        dispatch(clearCart());
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_RESTAURANT_KEY);
        localStorage.removeItem(CART_DELIVERY_KEY);
        setShowClearCartDialog(false);
    };

    const validateNewAddress = () => {
        const newErrors: Record<string, string> = {};
        if (!newAddress.street.trim()) newErrors.street = 'Укажите улицу';
        if (!newAddress.city.trim()) newErrors.city = 'Укажите город';
        if (!newAddress.zip.trim()) newErrors.zip = 'Укажите индекс';
        if (!newAddress.country.trim()) newErrors.country = 'Укажите страну';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddNewAddress = async () => {
        if (!user || !validateNewAddress()) return;

        try {
            await dispatch(addAddress({
                id: user.id,
                address: newAddress
            })).unwrap();

            setNewAddress({
                street: '',
                city: '',
                zip: '',
                state: '',
                country: '',
            });
            setErrors({});
            setShowNewAddressForm(false);
        } catch {
            alert('Не удалось добавить адрес');
        }
    };

    const handleConfirmOrder = () => {
        setShowConfirmDialog(true);
    };

    const handleGoToPayment = async () => {
        setShowConfirmDialog(false);

        if (!user) {
            navigate('/login', {
                state: {
                    from: '/cart',
                    message: 'Для оформления заказа необходимо войти в систему'
                }
            });
            return;
        }

        if (!getSelectedAddressText().trim()) {
            alert('Пожалуйста, выберите адрес доставки');
            return;
        }

        if (!user || !restaurantId) {
            alert('Ошибка: пользователь или ресторан не определены');
            return;
        }

        if (items.length === 0) {
            alert('Корзина пуста');
            return;
        }

        setIsProcessingPayment(true);

        try {
            if (selectedAddressId) {
                const selected = addresses.find(addr => addr.id === selectedAddressId);
                if (selected) {
                    dispatch(setDeliveryAddress(selected));
                    localStorage.setItem('last_order_address', JSON.stringify(selected));
                }
            }

            const result = await dispatch(createOrder({
                restaurantId: restaurantId,
                items: items.map(item => ({
                    dish_id: item.dishId,
                    restaurant_id: restaurantId,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name,
                    image: item.image
                }))
            })).unwrap();

            dispatch(clearCart());
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem(CART_RESTAURANT_KEY);
            localStorage.removeItem(CART_DELIVERY_KEY);
            localStorage.removeItem('cartItems');

            if (selectedAddressId) {
                const selected = addresses.find(addr => addr.id === selectedAddressId);
                if (selected && result.id) {
                    localStorage.setItem(`order_${result.id}_address`, JSON.stringify(selected));
                }
            }

            const paymentData = {
                orderId: result.id,
                total: total,
                restaurantId: restaurantId,
                items: items,
                address: selectedAddressId ? addresses.find(addr => addr.id === selectedAddressId) : null
            };

            localStorage.setItem('pending_payment_order', JSON.stringify(paymentData));

            navigate(`/payment/${result.id}`);

        } catch (error: any) {
            const errorMessage = error?.message ||
                error?.payload ||
                'Не удалось создать заказ. Проверьте данные и попробуйте снова.';

            alert(`Ошибка: ${errorMessage}`);
            setIsProcessingPayment(false);
        }
    };

    const handleAddressSelect = (addressId: string) => {
        setSelectedAddressId(addressId);
    };

    if (items.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Ваша корзина пуста
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Добавьте блюда из меню ресторанов
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => navigate('/')}>
                        Перейти к ресторанам
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Корзина
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {items.map(item => (
                            <Card key={item.dishId}>
                                <CardContent sx={{ display: 'flex', gap: 2, p: 2 }}>
                                    {item.image && (
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, height: 100, borderRadius: 2, objectFit: 'cover' }}
                                            image={item.image}
                                            alt={item.name}
                                        />
                                    )}

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="body1" color="primary" gutterBottom>
                                            {item.price} ₽
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.dishId, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Remove />
                                            </IconButton>
                                            <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                                                {item.quantity}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.dishId, item.quantity + 1)}
                                            >
                                                <Add />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemove(item.dishId)}
                                        >
                                            <Delete />
                                        </IconButton>
                                        <Typography variant="h6">
                                            {item.price * item.quantity} ₽
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}

                        <Button variant="outlined" color="error" onClick={handleClearCart}>
                            Очистить корзину
                        </Button>
                    </Box>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 88 }}>
                        <Typography variant="h6" gutterBottom>
                            Итого
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Сумма заказа</Typography>
                                <Typography>{subtotal.toFixed(2)} ₽</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Доставка</Typography>
                                <Typography>{deliveryFee.toFixed(2)} ₽</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">К оплате</Typography>
                                <Typography variant="h6" color="primary">
                                    {total.toFixed(2)} ₽
                                </Typography>
                            </Box>
                        </Box>

                        {!showCheckout ? (
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login', {
                                            state: {
                                                from: '/cart',
                                                message: 'Для оформления заказа необходимо войти в систему'
                                            }
                                        });
                                    } else {
                                        setShowCheckout(true);
                                    }
                                }}
                                startIcon={!user ? <Login /> : <Payment />}
                            >
                                {!user ? 'Войти для оплаты' : 'Перейти к оплате'}
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <LocationOn />
                                            <Typography>Выберите адрес доставки</Typography>
                                        </Box>
                                    </FormLabel>

                                    {addresses.length > 0 ? (
                                        <RadioGroup
                                            value={selectedAddressId}
                                            onChange={(e) => handleAddressSelect(e.target.value)}
                                        >
                                            {addresses.map(address => (
                                                <FormControlLabel
                                                    key={address.id}
                                                    value={address.id}
                                                    control={<Radio />}
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {address.street}, {address.city}, {address.zip}{address.state ? `, ${address.state}` : ''}, {address.country}
                                                            </Typography>
                                                            {address.isDefault && (
                                                                <Typography variant="caption" color="primary">
                                                                    Основной адрес
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            У вас нет сохраненных адресов
                                        </Alert>
                                    )}

                                    <Button
                                        startIcon={<AddLocation />}
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => {
                                            if (!user) {
                                                navigate('/login', {
                                                    state: {
                                                        from: '/cart',
                                                        message: 'Для добавления адреса необходимо войти в систему'
                                                    }
                                                });
                                            } else {
                                                setShowNewAddressForm(true);
                                            }
                                        }}
                                        sx={{ mt: 1 }}
                                    >
                                        Добавить новый адрес
                                    </Button>
                                </FormControl>

                                <Divider sx={{ my: 1 }} />

                                {selectedAddressId && (
                                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Выбранный адрес:
                                        </Typography>
                                        <Typography variant="body1">
                                            {getSelectedAddressText()}
                                        </Typography>
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={handleConfirmOrder}
                                    disabled={isProcessingPayment || !selectedAddressId}
                                    startIcon={isProcessingPayment ? <CircularProgress size={20} /> : <Payment />}
                                >
                                    {isProcessingPayment ? 'Подготовка к оплате...' : 'Перейти к оплате'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setShowCheckout(false)}
                                >
                                    Назад к корзине
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Dialog
                open={showNewAddressForm}
                onClose={() => setShowNewAddressForm(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Добавить новый адрес</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Улица, дом, квартира"
                            fullWidth
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            error={!!errors.street}
                            helperText={errors.street}
                            required
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={8}>
                                <TextField
                                    label="Город"
                                    fullWidth
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    error={!!errors.city}
                                    helperText={errors.city}
                                    required
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="Индекс"
                                    fullWidth
                                    value={newAddress.zip}
                                    onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                                    error={!!errors.zip}
                                    helperText={errors.zip}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Область/Регион (необязательно)"
                            fullWidth
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />

                        <TextField
                            label="Страна"
                            fullWidth
                            value={newAddress.country}
                            onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                            error={!!errors.country}
                            helperText={errors.country}
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNewAddressForm(false)}>
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddNewAddress}
                        disabled={!user}
                    >
                        Добавить адрес
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Подтверждение заказа</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Typography variant="body1">
                            Вы уверены, что хотите создать заказ на сумму <strong>{total.toFixed(2)} ₽</strong>?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            После подтверждения вы будете перенаправлены на страницу оплаты.
                        </Typography>
                        {selectedAddressId && (
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Адрес доставки:
                                </Typography>
                                <Typography variant="body1">
                                    {getSelectedAddressText()}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleGoToPayment}
                        autoFocus
                    >
                        Подтвердить и перейти к оплате
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={showClearCartDialog}
                onClose={() => setShowClearCartDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Очистка корзины</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Typography variant="body1">
                            Вы уверены, что хотите очистить корзину?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Это действие нельзя отменить. Все товары будут удалены.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowClearCartDialog(false)}>
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmClearCart}
                    >
                        Очистить корзину
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}