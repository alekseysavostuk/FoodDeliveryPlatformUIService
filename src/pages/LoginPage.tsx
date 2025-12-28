import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Link,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { login, clearError } from '../redux/slices/authSlice';
import { fetchUserById } from '../redux/slices/profileSlice';
import axios from 'axios';

export function LoginPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, loading, error } = useAppSelector(state => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const loginResult = await dispatch(login({ email, password })).unwrap();

            if (loginResult?.user?.id) {
                setIsFetchingProfile(true);

                try {
                    const source = axios.CancelToken.source();
                    const userProfile = await dispatch(fetchUserById({
                        id: loginResult.user.id,
                        cancelToken: source.token
                    })).unwrap();

                    const userData = localStorage.getItem('user');
                    if (userData) {
                        const parsedUser = JSON.parse(userData);

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

                        const updatedUser = {
                            ...parsedUser,
                            phoneNumber: userProfile.phoneNumber ? normalizePhoneNumber(userProfile.phoneNumber) : parsedUser.phoneNumber,
                            phone: userProfile.phoneNumber ? normalizePhoneNumber(userProfile.phoneNumber) : parsedUser.phone,
                            name: userProfile.name || parsedUser.name,
                            email: userProfile.email || parsedUser.email
                        };

                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }

                } catch (profileError) {
                } finally {
                    setIsFetchingProfile(false);
                }
            }
        } catch (loginError) {
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    const isLoading = loading || isFetchingProfile;

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Вход в систему
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                        autoComplete="email"
                    />

                    <TextField
                        label="Пароль"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 3 }}
                        autoComplete="current-password"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={isLoading}
                        sx={{ mb: 2 }}
                    >
                        {isLoading ? (
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : 'Войти'}
                    </Button>

                    {isFetchingProfile && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Загрузка профиля...
                        </Alert>
                    )}

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Нет аккаунта?{' '}
                            <Link component={RouterLink} to="/register">
                                Зарегистрироваться
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}