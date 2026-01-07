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
    Menu as MenuIcon,
    LockReset,
    Login,
    HowToReg,
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
    const [authMenuAnchorEl, setAuthMenuAnchorEl] = useState<null | HTMLElement>(null);

    const open = Boolean(anchorEl);
    const authMenuOpen = Boolean(authMenuAnchorEl);

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

    const handleAuthMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAuthMenuAnchorEl(event.currentTarget);
    };

    const handleAuthMenuClose = () => {
        setAuthMenuAnchorEl(null);
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        handleAuthMenuClose();
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

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Корзина */}
                        <IconButton
                            component={RouterLink}
                            to="/cart"
                            color="primary"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                },
                                '&.Mui-focusVisible': {
                                    outline: 'none',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            <Badge
                                badgeContent={totalItems}
                                color="primary"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        animation: totalItems > 0 ? 'pulse 1s ease-in-out' : 'none',
                                    },
                                    '@keyframes pulse': {
                                        '0%': { transform: 'scale(1)' },
                                        '50%': { transform: 'scale(1.2)' },
                                        '100%': { transform: 'scale(1)' },
                                    }
                                }}
                            >
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
                                    sx={{
                                        display: { xs: 'flex', md: 'none' },
                                        '&:hover': {
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                        },
                                        '&.Mui-focusVisible': {
                                            outline: 'none',
                                            boxShadow: 'none',
                                        },
                                    }}
                                    color="primary"
                                >
                                    <AccountCircle />
                                </IconButton>
                            </>
                        ) : (
                            <IconButton
                                onClick={handleAuthMenuClick}
                                color="primary"
                                sx={{
                                    position: 'relative',
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                    },
                                    '&.Mui-focusVisible': {
                                        outline: 'none',
                                        boxShadow: 'none',
                                    },
                                    '&:after': authMenuOpen ? {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                        animation: 'ripple 0.6s ease-out',
                                    } : {},
                                    '@keyframes ripple': {
                                        '0%': {
                                            transform: 'scale(0.8)',
                                            opacity: 0.5,
                                        },
                                        '100%': {
                                            transform: 'scale(1.4)',
                                            opacity: 0,
                                        },
                                    }
                                }}
                            >
                                <MenuIcon
                                    sx={{
                                        transition: 'transform 0.3s ease',
                                        transform: authMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                    }}
                                />
                            </IconButton>
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
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 220,
                        '& .MuiMenuItem-root': {
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            },
                        }
                    }
                }}
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
            <Menu
                anchorEl={authMenuAnchorEl}
                open={authMenuOpen}
                onClose={handleAuthMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 220,
                        '& .MuiMenuItem-root': {
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            },
                        }
                    }
                }}
            >
                <MenuItem onClick={() => handleNavigate('/login')}>
                    <Login sx={{ mr: 2 }} />
                    Войти
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/register')}>
                    <HowToReg sx={{ mr: 2 }} />
                    Регистрация
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/restore')}>
                    <LockReset sx={{ mr: 2 }} />
                    Восстановить аккаунт
                </MenuItem>
            </Menu>
        </AppBar>
    );
}