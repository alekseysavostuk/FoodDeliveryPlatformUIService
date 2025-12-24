import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import { store } from './redux/store';
import { restoreUserFromStorage } from './redux/slices/authSlice';
import { useAppDispatch } from './redux/hooks';
import { theme } from './theme/theme';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RestaurantListPage } from './pages/RestaurantListPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { UserOrdersPage } from './pages/UserOrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentPage } from './pages/PaymentPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRestaurantsPage } from './pages/admin/AdminRestaurantsPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserProfilePage } from './pages/admin/AdminUserProfilePage';
import { AdminUserOrdersPage } from './pages/admin/AdminUserOrdersPage';

export default function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(restoreUserFromStorage());
    }, [dispatch]);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<RestaurantListPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="register" element={<RegisterPage />} />
                            <Route path="restaurant/:id" element={<MenuPage />} />

                            <Route path="cart" element={<CartPage />} />

                            <Route path="orders" element={
                                <ProtectedRoute>
                                    <UserOrdersPage />
                                </ProtectedRoute>
                            } />

                            <Route path="payment/:id" element={<PaymentPage />} />

                            <Route path="order/:id" element={
                                <ProtectedRoute>
                                    <OrderStatusPage />
                                </ProtectedRoute>
                            } />

                            <Route path="profile" element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />

                            <Route path="admin" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />

                            <Route path="admin/users" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminUsersPage />
                                </ProtectedRoute>
                            } />

                            <Route path="admin/users/:id" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminUserProfilePage />
                                </ProtectedRoute>
                            } />

                            <Route path="admin/users/:id/orders" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminUserOrdersPage />
                                </ProtectedRoute>
                            } />

                            <Route path="admin/restaurants" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminRestaurantsPage />
                                </ProtectedRoute>
                            } />

                            <Route path="admin/restaurants/:id/menu" element={
                                <ProtectedRoute requiredRole="ADMIN">
                                    <AdminMenuPage />
                                </ProtectedRoute>
                            } />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    );
}