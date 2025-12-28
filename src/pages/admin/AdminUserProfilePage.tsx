import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Button,
    List,
    ListItem,
    ListItemText,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Card,
    CardContent,
    IconButton,
    Divider,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    LocationOn as LocationIcon,
    Home as HomeIcon,
    ShoppingBag,
    Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import {
    fetchUserById,
    fetchAddresses,
} from '../../redux/slices/profileSlice';
import axios from "axios";

const formatPhoneForDisplay = (phone: string | undefined): string => {
    if (!phone) return 'Не указан';

    const normalizePhoneNumber = (phone: string): string => {
        if (!phone) return '';
        let normalized = phone.replaceAll(/\D/g, '');
        if (normalized.startsWith('80') && normalized.length === 11) {
            normalized = '375' + normalized.substring(2);
        }
        if (normalized.startsWith('+')) {
            normalized = normalized.substring(1);
        }
        return normalized;
    };

    const normalized = normalizePhoneNumber(phone);
    if (normalized.length === 12 && normalized.startsWith('375')) {
        const operator = normalized.substring(3, 5);
        const part1 = normalized.substring(5, 8);
        const part2 = normalized.substring(8, 10);
        const part3 = normalized.substring(10, 12);
        return `+375 (${operator}) ${part1}-${part2}-${part3}`;
    }

    return phone;
};

export function AdminUserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        selectedUser,
        addresses,
        usersLoading: loading,
        usersError: error,
    } = useAppSelector(state => state.profile);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const mountedRef = useRef(true);
    const loadedUserIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        mountedRef.current = true;

        if (!id) return;

        const fetchData = async () => {
            if (loadedUserIds.current.has(id)) {
                return;
            }

            loadedUserIds.current.add(id);

            const source = axios.CancelToken.source();

            try {
                await Promise.all([
                    dispatch(fetchUserById({
                        id: id,
                        cancelToken: source.token
                    })),
                    dispatch(fetchAddresses({
                        userId: id,
                        cancelToken: source.token
                    }))
                ]);
            } catch (error) {
                if (axios.isCancel(error)) {
                    loadedUserIds.current.delete(id);
                    return;
                }
                loadedUserIds.current.delete(id);
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, id]);

    const formatAddress = (address: any) => {
        return `${address.street}, ${address.city}, ${address.zip}${address.state ? `, ${address.state}` : ''}, ${address.country}`;
    };

    if (loading && !selectedUser) {
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

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
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

    if (!selectedUser) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
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
                autoHideDuration={4000}
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
                <Avatar
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        fontSize: 32,
                    }}
                >
                    {selectedUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        {selectedUser.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {selectedUser.id.substring(0, 12)}...
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon />
                            Основная информация
                        </Typography>

                        <Card variant="outlined" sx={{ mt: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Полный ID
                                        </Typography>
                                        <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                                            {selectedUser.id}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <EmailIcon fontSize="small" />
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedUser.email}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PhoneIcon fontSize="small" />
                                            Телефон
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatPhoneForDisplay(selectedUser.phoneNumber)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon />
                            Адреса доставки пользователя
                        </Typography>

                        {addresses.length === 0 ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                У пользователя нет сохраненных адресов
                            </Alert>
                        ) : (
                            <List sx={{ mt: 2 }}>
                                {addresses.map((address) => (
                                    <ListItem
                                        key={address.id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1,
                                            bgcolor: address.isDefault ? 'primary.50' : 'background.paper',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <IconButton
                                            color={address.isDefault ? "primary" : "default"}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        >
                                            <HomeIcon />
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
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<ShoppingBag />}
                            onClick={() => navigate(`/admin/users/${id}/orders`)}
                            fullWidth
                        >
                            Просмотреть заказы пользователя
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}