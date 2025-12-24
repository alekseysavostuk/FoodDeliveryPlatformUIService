import {useState, useEffect, useRef} from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    CircularProgress,
    DialogContentText,
    InputAdornment,
} from '@mui/material';
import {
    Edit,
    LocationOn,
    Person,
    Add,
    Delete,
    Save,
    Home,
    Warning,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import {
    updateProfile,
    updateAddress,
    fetchAddresses,
    addAddress,
    deleteAddress,
    changePassword,
    deleteUser,
} from '../redux/slices/profileSlice';
import { logout as authLogout } from '../redux/slices/authSlice';
import axios from "axios";

const loadedAddressUsers = new Set<string>();

export function ProfilePage() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const {
        addresses,
        loading,
        error
    } = useAppSelector(state => state.profile);

    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [addressDialog, setAddressDialog] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [currentAddressId, setCurrentAddressId] = useState<string | null>(null);
    const [addressForm, setAddressForm] = useState({
        street: '',
        city: '',
        zip: '',
        state: '',
        country: '',
    });
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const CONFIRMATION_PHRASE = "удалить аккаунт";

    const mountedRef = useRef(true);
    const lastUserIdRef = useRef<string>('');

    useEffect(() => {
        mountedRef.current = true;

        const fetchAddressesData = async () => {
            if (!user?.id) return;

            if (lastUserIdRef.current === user.id && addresses.length > 0) {
                return;
            }

            if (loadedAddressUsers.has(user.id)) {
                return;
            }

            loadedAddressUsers.add(user.id);
            lastUserIdRef.current = user.id;

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchAddresses({
                    userId: user.id,
                    cancelToken: source.token
                }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    loadedAddressUsers.delete(user.id);
                    return;
                }
                console.error('Ошибка загрузки адресов:', error);
                loadedAddressUsers.delete(user.id);
            }
        };

        fetchAddressesData();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, user?.id]);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (lastUserIdRef.current && user?.id !== lastUserIdRef.current) {
                loadedAddressUsers.delete(lastUserIdRef.current);
            }
        };
    }, [user?.id]);

    const handleUpdateProfile = async () => {
        if (!user?.id || !name.trim()) {
            setSuccessMessage('Имя не может быть пустым');
            return;
        }

        try {
            await dispatch(updateProfile({
                id: user.id,
                name: name.trim()
            })).unwrap();

            const userData = localStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                parsedUser.name = name.trim();
                localStorage.setItem('user', JSON.stringify(parsedUser));
            }

            setEditMode(false);
            setSuccessMessage('Профиль успешно обновлен');
        } catch {
            setSuccessMessage('Ошибка обновления профиля');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation.toLowerCase() !== CONFIRMATION_PHRASE) {
            setDeleteError(`Пожалуйста, введите "${CONFIRMATION_PHRASE}" для подтверждения`);
            return;
        }

        if (!deletePassword) {
            setDeleteError('Введите ваш пароль для подтверждения');
            return;
        }

        if (!user?.id) {
            setDeleteError('Данные пользователя не найдены');
            return;
        }

        try {
            await dispatch(deleteUser({
                id: user.id,
                password: deletePassword
            })).unwrap();

            setSuccessMessage('Аккаунт успешно удален');
            setDeleteDialog(false);

            loadedAddressUsers.delete(user.id);

            setTimeout(() => {
                dispatch(authLogout());
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.clear();
                window.location.href = '/';
            }, 1500);

        } catch (err: any) {
            if (err.message?.includes('403') ||
                err.message?.includes('Forbidden') ||
                err.message?.includes('Доступ запрещен') ||
                err.message?.includes('Неверный пароль')) {
                setDeleteError('Неверный пароль. Попробуйте еще раз.');
            } else if (err.message?.includes('401') ||
                err.message?.includes('Unauthorized')) {
                setDeleteError('Сессия истекла. Пожалуйста, войдите снова.');
            } else if (err.message?.includes('404') ||
                err.message?.includes('Not found')) {
                setDeleteError('Пользователь не найден');
            } else if (err.message?.includes('Network Error')) {
                setDeleteError('Проблемы с соединением. Проверьте интернет.');
            } else {
                setDeleteError(err.message || 'Произошла ошибка при удалении аккаунта');
            }
        }
    };

    const handleAddAddressClick = () => {
        setAddressForm({
            street: '',
            city: '',
            zip: '',
            state: '',
            country: '',
        });
        setIsEditingAddress(false);
        setCurrentAddressId(null);
        setAddressDialog(true);
    };

    const handleSaveAddress = async () => {
        if (!addressForm.street || !addressForm.city || !addressForm.zip || !addressForm.country) {
            setSuccessMessage('Заполните все обязательные поля');
            return;
        }

        try {
            if (isEditingAddress && currentAddressId) {
                const addressData = {
                    ...addressForm,
                    id: currentAddressId,
                };

                await dispatch(updateAddress(addressData)).unwrap();
                setSuccessMessage('Адрес обновлен');
                setAddressDialog(false);
            } else {
                await dispatch(addAddress({
                    id: user?.id || '',
                    address: addressForm
                })).unwrap();
                setSuccessMessage('Адрес добавлен');
                setAddressDialog(false);
            }
        } catch {
            setSuccessMessage('Ошибка при сохранении адреса');
        }
    };

    const handleEditAddressClick = (address: any) => {
        setAddressForm({
            street: address.street,
            city: address.city,
            zip: address.zip,
            state: address.state || '',
            country: address.country,
        });
        setIsEditingAddress(true);
        setCurrentAddressId(address.id);
        setAddressDialog(true);
    };

    const handleDeleteAddress = async (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот адрес?')) {
            try {
                await dispatch(deleteAddress(id)).unwrap();
                setSuccessMessage('Адрес удален');
            } catch {
                setSuccessMessage('Ошибка удаления адреса');
            }
        }
    };

    const handleChangePassword = async () => {
        if (!user?.id || !user?.email) {
            setSuccessMessage('Данные пользователя не найдены');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setSuccessMessage('Пароли не совпадают');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setSuccessMessage('Пароль должен быть не менее 6 символов');
            return;
        }

        try {
            await dispatch(changePassword({
                userId: user.id,
                email: user.email,
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            })).unwrap();

            setPasswordDialog(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setSuccessMessage('Пароль успешно изменен');
        } catch (err: any) {
            setSuccessMessage(err.message || 'Ошибка смены пароля');
        }
    };

    const formatAddress = (address: any) => {
        return `${address.street}, ${address.city}, ${address.zip}${address.state ? `, ${address.state}` : ''}, ${address.country}`;
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="h4" gutterBottom>
                Мой профиль
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Person sx={{ mr: 1 }} />
                            <Typography variant="h6">Личная информация</Typography>
                            <IconButton
                                sx={{ ml: 'auto' }}
                                onClick={() => {
                                    setName(user?.name || '');
                                    setEditMode(!editMode);
                                }}
                                disabled={loading}
                            >
                                <Edit />
                            </IconButton>
                        </Box>

                        {editMode ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Имя"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    fullWidth
                                    disabled={loading}
                                />
                                <TextField
                                    label="Email"
                                    value={user?.email}
                                    type="email"
                                    fullWidth
                                    disabled
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                                        onClick={handleUpdateProfile}
                                        disabled={loading || !name.trim()}
                                    >
                                        Сохранить
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setEditMode(false)}
                                        disabled={loading}
                                    >
                                        Отмена
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                <Typography><strong>Имя:</strong> {user?.name}</Typography>
                                <Typography><strong>Email:</strong> {user?.email}</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <LocationOn sx={{ mr: 1 }} />
                            <Typography variant="h6">Мои адреса</Typography>
                        </Box>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Адрес по умолчанию будет использоваться при оформлении заказов
                        </Alert>

                        <List>
                            {addresses.map((address) => (
                                <ListItem
                                    key={address.id}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: address.isDefault ? 'primary.light' : 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <IconButton
                                        color={address.isDefault ? "primary" : "default"}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    >
                                        <Home />
                                    </IconButton>

                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {formatAddress(address)}
                                                {address.isDefault && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            ml: 1,
                                                            bgcolor: 'primary.main',
                                                            color: 'white',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        По умолчанию
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            onClick={() => handleEditAddressClick(address)}
                                            sx={{ mr: 1 }}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDeleteAddress(address.id)}
                                            color="error"
                                            disabled={address.isDefault}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>

                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAddAddressClick}
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Добавить адрес
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Безопасность
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setPasswordDialog(true)}
                                    disabled={loading}
                                >
                                    Сменить пароль
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    onClick={() => {
                                        setDeleteDialog(true);
                                        setDeleteConfirmation('');
                                        setDeletePassword('');
                                        setDeleteError('');
                                    }}
                                    disabled={loading}
                                >
                                    Удалить аккаунт
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={addressDialog} onClose={() => setAddressDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {isEditingAddress ? 'Редактирование адреса' : 'Добавление нового адреса'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Улица, дом, квартира"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                            fullWidth
                            required
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Город"
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Индекс"
                                    value={addressForm.zip}
                                    onChange={(e) => setAddressForm({...addressForm, zip: e.target.value})}
                                    fullWidth
                                    required
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Область"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            fullWidth
                        />
                        <TextField
                            label="Страна"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                            fullWidth
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddressDialog(false)}>Отмена</Button>
                    <Button
                        onClick={handleSaveAddress}
                        variant="contained"
                        disabled={!addressForm.street || !addressForm.city || !addressForm.zip || !addressForm.country}
                    >
                        {isEditingAddress ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Смена пароля</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Текущий пароль"
                            type="password"
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Новый пароль"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Подтвердите новый пароль"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            fullWidth
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialog(false)}>Отмена</Button>
                    <Button
                        onClick={handleChangePassword}
                        variant="contained"
                        disabled={
                            !passwordForm.oldPassword ||
                            !passwordForm.newPassword ||
                            !passwordForm.confirmPassword
                        }
                    >
                        Сменить пароль
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialog}
                onClose={() => !loading && setDeleteDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Warning color="error" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="span" color="error">
                            Удаление аккаунта
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Это действие <strong>необратимо</strong>. Все ваши данные будут удалены:
                    </DialogContentText>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="error" gutterBottom>
                            • Все заказы и история покупок
                        </Typography>
                        <Typography variant="body2" color="error" gutterBottom>
                            • Сохраненные адреса доставки
                        </Typography>
                        <Typography variant="body2" color="error" gutterBottom>
                            • Персональные данные
                        </Typography>
                        <Typography variant="body2" color="error" gutterBottom>
                            • Настройки и предпочтения
                        </Typography>
                    </Box>

                    {deleteError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {deleteError}
                        </Alert>
                    )}

                    <TextField
                        label={`Введите "${CONFIRMATION_PHRASE}" для подтверждения`}
                        value={deleteConfirmation}
                        onChange={(e) => {
                            setDeleteConfirmation(e.target.value);
                            setDeleteError('');
                        }}
                        fullWidth
                        sx={{ mb: 2 }}
                        error={!!deleteError && deleteConfirmation.toLowerCase() !== CONFIRMATION_PHRASE}
                        helperText={deleteError && deleteConfirmation.toLowerCase() !== CONFIRMATION_PHRASE
                            ? `Введите "${CONFIRMATION_PHRASE}"`
                            : ''}
                    />

                    <TextField
                        label="Введите ваш пароль"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => {
                            setDeletePassword(e.target.value);
                            setDeleteError('');
                        }}
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Warning color="error" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Alert severity="warning" sx={{ mt: 3 }}>
                        После удаления аккаунта восстановление данных будет невозможно
                    </Alert>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialog(false)}
                        disabled={loading}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleDeleteAccount}
                        color="error"
                        variant="contained"
                        disabled={
                            loading ||
                            deleteConfirmation.toLowerCase() !== CONFIRMATION_PHRASE ||
                            !deletePassword
                        }
                        startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {loading ? 'Удаление...' : 'Удалить аккаунт'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}