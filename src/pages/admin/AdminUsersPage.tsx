import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Avatar,
    InputAdornment,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Search as SearchIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    fetchAllUsers,
    deleteUserAdmin,
} from '../../redux/slices/profileSlice';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

export function AdminUsersPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const {
        allUsers: users,
        usersLoading: loading,
        usersError: error,
    } = useAppSelector(state => state.profile);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const mountedRef = useRef(true);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        const fetchUsers = async () => {
            if (hasFetchedRef.current) {
                return;
            }

            const cacheKey = 'admin_users_loaded';
            const isLoaded = sessionStorage.getItem(cacheKey);

            if (isLoaded === 'true' && users.length > 0) {
                return;
            }

            hasFetchedRef.current = true;
            sessionStorage.setItem(cacheKey, 'true');

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchAllUsers({
                    cancelToken: source.token
                }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    hasFetchedRef.current = false;
                    sessionStorage.removeItem(cacheKey);
                    return;
                }
                hasFetchedRef.current = false;
                sessionStorage.removeItem(cacheKey);
            }
        };

        fetchUsers();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, users.length]);

    useEffect(() => {
        return () => {
            sessionStorage.removeItem('admin_users_loaded');
        };
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDeleteDialog = (userId: string) => {
        setSelectedUserId(userId);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSelectedUserId(null);
    };

    const handleDeleteUser = async () => {
        if (!selectedUserId) return;

        try {
            await dispatch(deleteUserAdmin(selectedUserId)).unwrap();

            setSnackbar({
                open: true,
                message: 'Пользователь успешно удален',
                severity: 'success'
            });
            handleCloseDeleteDialog();

            hasFetchedRef.current = false;
            sessionStorage.removeItem('admin_users_loaded');

            const source = axios.CancelToken.source();
            dispatch(fetchAllUsers({ cancelToken: source.token }));
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при удалении пользователя',
                severity: 'error'
            });
        }
    };

    const handleUserClick = (userId: string) => {
        navigate(`/admin/users/${userId}`);
    };

    if (loading && users.length === 0) {
        return (
            <Container maxWidth="xl" sx={{
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
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Container>
        );
    }

    const totalUsers = users.length;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Управление пользователями
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Всего пользователей: {totalUsers}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <TextField
                        variant="outlined"
                        placeholder="Поиск по имени или email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => {
                            hasFetchedRef.current = false;
                            sessionStorage.removeItem('admin_users_loaded');
                            const source = axios.CancelToken.source();
                            dispatch(fetchAllUsers({ cancelToken: source.token }));
                        }}
                        disabled={loading}
                    >
                        Обновить
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Пользователь</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            {searchTerm ? 'Пользователи не найдены' : 'Нет пользователей'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <TableRow
                                        hover
                                        key={user.id}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => handleUserClick(user.id)}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight="medium">
                                                        {user.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ID: {user.id.substring(0, 8)}...
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Tooltip title="Удалить">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDeleteDialog(user.id);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {filteredUsers.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredUsers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Строк на странице:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} из ${count}`
                        }
                    />
                )}
            </Paper>

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить этого пользователя?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Все данные пользователя будут удалены без возможности восстановления!
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
                    <Button onClick={handleDeleteUser} color="error" variant="contained">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
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
        </Container>
    );
}