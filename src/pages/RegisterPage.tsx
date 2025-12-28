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
import { register, clearError } from '../redux/slices/authSlice';

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

const validatePhoneNumber = (value: string) => {
    if (!value.trim()) return { isValid: false, error: 'Номер телефона обязателен' };

    const normalizedPhone = normalizePhoneNumber(value);
    const regex = /^375(29|25|33|44)\d{7}$/;

    if (!regex.test(normalizedPhone)) {
        return {
            isValid: false,
            error: 'Формат: 375XXXXXXXXX (12 цифр, код оператора 29,25,33,44)'
        };
    }
    return { isValid: true, error: '' };
};

const applyPhoneMask = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';

    let displayValue = cleaned;
    if (cleaned.startsWith('80') && cleaned.length === 11) {
        displayValue = '375' + cleaned.substring(2);
    }

    if (displayValue.startsWith('375') && displayValue.length >= 12) {
        const operator = displayValue.substring(3, 5);
        let formatted = `+375 (${operator}`;

        if (displayValue.length > 5) {
            const part1 = displayValue.substring(5, 8);
            formatted += `) ${part1}`;
        }
        if (displayValue.length > 8) {
            const part2 = displayValue.substring(8, 10);
            formatted += `-${part2}`;
        }
        if (displayValue.length > 10) {
            const part3 = displayValue.substring(10, 12);
            formatted += `-${part3}`;
        }

        return formatted;
    }

    return value;
};

export function RegisterPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, loading, error } = useAppSelector(state => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedValue = applyPhoneMask(value);
        setPhone(formattedValue);

        if (formattedValue.trim()) {
            const validation = validatePhoneNumber(formattedValue);
            setPhoneError(validation.error);
        } else {
            setPhoneError('Номер телефона обязателен');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');
        setPhoneError('');

        const nameRegex = /^[\p{L}]+$/u;
        if (!name.trim()) {
            setValidationError('Имя обязательно для заполнения');
            return;
        }

        if (!nameRegex.test(name)) {
            setValidationError('Имя должно содержать только буквы');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError('Некорректный email');
            return;
        }

        if (!phone.trim()) {
            setPhoneError('Номер телефона обязателен');
            setValidationError('Номер телефона обязателен для регистрации');
            return;
        }

        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
            setPhoneError(phoneValidation.error);
            setValidationError('Исправьте ошибки в поле телефона');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Пароли не совпадают');
            return;
        }

        if (password.length < 6) {
            setValidationError('Пароль должен содержать минимум 6 символов');
            return;
        }

        try {
            await dispatch(register({
                name,
                email,
                password,
                phoneNumber: phone.trim()
            })).unwrap();

            navigate('/login');
        } catch (err) {
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Регистрация
                </Typography>

                {(error || validationError) && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error || validationError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        label="Имя"
                        fullWidth
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ mb: 2 }}
                        autoComplete="name"
                        helperText="Только буквы"
                        error={validationError.includes('Имя')}
                    />

                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                        autoComplete="email"
                        error={validationError.includes('email')}
                    />

                    <TextField
                        label="Номер телефона *"
                        value={phone}
                        onChange={handlePhoneChange}
                        fullWidth
                        required
                        placeholder="+375 (29) 123-45-67"
                        sx={{ mb: 2 }}
                        error={!!phoneError}
                    />

                    <TextField
                        label="Пароль"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ minLength: 6 }}
                        autoComplete="new-password"
                        helperText="Минимум 6 символов"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
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

                    <TextField
                        label="Повторите пароль"
                        type={showConfirmPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ mb: 3 }}
                        autoComplete="new-password"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleClickShowConfirmPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                        disabled={loading || !!phoneError}
                        sx={{ mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Уже есть аккаунт?{' '}
                            <Link component={RouterLink} to="/login">
                                Войти
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}