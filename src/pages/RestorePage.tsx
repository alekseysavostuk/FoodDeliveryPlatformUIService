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
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { restoreAccount, clearRestoreStatus } from '../redux/slices/authSlice';

export function RestorePage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user, restoreLoading, restoreSuccess, restoreMessage, error } = useAppSelector(state => state.auth);

    const [email, setEmail] = useState('');
    const [localMessage, setLocalMessage] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearRestoreStatus());
            setLocalMessage(null);
            setLocalError(null);
        };
    }, [dispatch]);

    useEffect(() => {
        if (restoreSuccess && restoreMessage) {
            setLocalMessage(restoreMessage);
            setLocalError(null);
        } else if (error) {
            setLocalError(error);
            setLocalMessage(null);
        } else if (restoreMessage && !restoreSuccess) {
            setLocalError(restoreMessage);
            setLocalMessage(null);
        }
    }, [restoreSuccess, restoreMessage, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setLocalError('Введите email');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setLocalError('Введите корректный email');
            return;
        }

        setLocalMessage(null);
        setLocalError(null);

        try {
            const result = await dispatch(restoreAccount({ email })).unwrap();

            if (result.success) {

                setLocalMessage(result.message || 'Инструкции по восстановлению отправлены на email');
                setEmail('');
            }
        } catch (err) {
            if (!localError) {
                setLocalError('Произошла ошибка при отправке запроса');
            }
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Восстановление аккаунта
                </Typography>

                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Введите email, который вы использовали при регистрации.
                    Мы отправим вам инструкции по восстановлению доступа.
                </Typography>

                {localMessage && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {localMessage}
                    </Alert>
                )}

                {localError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {localError}
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
                        sx={{ mb: 3 }}
                        autoComplete="email"
                        placeholder="example@email.com"
                        disabled={restoreLoading || localMessage !== null}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={restoreLoading || localMessage !== null}
                        sx={{ mb: 2 }}
                    >
                        {restoreLoading ? (
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : localMessage ? 'Отправлено' : 'Восстановить'}
                    </Button>

                    {localMessage && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Проверьте вашу почту. Если письмо не пришло, проверьте папку "Спам".
                        </Alert>
                    )}

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Вспомнили пароль?{' '}
                            <Link component={RouterLink} to="/login">
                                Войти
                            </Link>
                        </Typography>
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