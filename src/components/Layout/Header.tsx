import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Badge,
    Box,
    Container,
    Chip,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import {
    ShoppingCart,
    Person,
    Logout,
    Shield,
    Receipt,
    AccountCircle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { useState } from 'react';

export function Header() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector(state => state.auth);
    const cartItems = useAppSelector(state => state.cart.items);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        navigate('/profile');
        handleClose();
    };

    const handleOrders = () => {
        navigate('/orders');
        handleClose();
    };

    return (
        <AppBar position="sticky" color="inherit" elevation={1}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ gap: 2 }}>
                    <Typography
                        variant="h5"
                        component={RouterLink}
                        to="/"
                        sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 700,
                            flexGrow: { xs: 1, md: 0 },
                            mr: { md: 4 },
                        }}
                    >
                        Доставка Минск
                    </Typography>

                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            component={RouterLink}
                            to="/cart"
                            color="primary"
                        >
                            <Badge badgeContent={totalItems} color="primary">
                                <ShoppingCart />
                            </Badge>
                        </IconButton>

                        {user ? (
                            <>
                                {user.role === 'ADMIN' && (
                                    <Button
                                        component={RouterLink}
                                        to="/admin"
                                        startIcon={<Shield />}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ display: { xs: 'none', md: 'flex' } }}
                                    >
                                        Админ-панель
                                    </Button>
                                )}

                                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<Person />}
                                        label={user.name}
                                        variant="outlined"
                                        onClick={handleProfileClick}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                </Box>

                                <IconButton
                                    onClick={handleProfileClick}
                                    sx={{ display: { xs: 'flex', md: 'none' } }}
                                    color="primary"
                                >
                                    <AccountCircle />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    color="primary"
                                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                                >
                                    Войти
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/register"
                                    variant="contained"
                                    color="primary"
                                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                                >
                                    Регистрация
                                </Button>

                                <IconButton
                                    component={RouterLink}
                                    to="/login"
                                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                                    color="primary"
                                >
                                    <AccountCircle />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleProfile}>
                    <Person sx={{ mr: 2 }} />
                    Профиль
                </MenuItem>
                <MenuItem onClick={handleOrders}>
                    <Receipt sx={{ mr: 2 }} />
                    Мои заказы
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 2 }} />
                    Выйти
                </MenuItem>
            </Menu>
        </AppBar>
    );
}