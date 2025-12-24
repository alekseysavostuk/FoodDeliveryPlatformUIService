import { useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    InputAdornment,
    CardMedia,
    Badge,
    Avatar,
    AvatarGroup,
    Card,
    CardContent,
    LinearProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    RestaurantMenu as MenuIcon,
    Search as SearchIcon,
    Image as ImageIcon,
    CloudUpload as UploadIcon,
    Close as CloseIcon,
    DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    fetchRestaurantImages,
    uploadRestaurantImage,
    deleteRestaurantImage,
    deleteAllRestaurantImages,
    getRestaurantImageUrl,
} from '../../redux/slices/restaurantsSlice';
import axios from 'axios';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

interface RestaurantFormData {
    name: string;
    cuisine: string;
    address: string;
}

interface RestaurantRowProps {
    restaurant: any;
    restaurantImageUrls: string[];
    imageLoading: boolean;
    onEdit: (restaurant: any) => void;
    onDelete: (restaurant: any) => void;
    onManageImages: (restaurant: any) => void;
}

const RestaurantRow: React.FC<RestaurantRowProps> = ({
                                                         restaurant,
                                                         restaurantImageUrls,
                                                         imageLoading,
                                                         onEdit,
                                                         onDelete,
                                                         onManageImages
                                                     }) => {
    const hasImages = restaurantImageUrls.length > 0;

    return (
        <TableRow hover>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {hasImages ? (
                        <Badge
                            badgeContent={restaurantImageUrls.length}
                            color="primary"
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                        >
                            <CardMedia
                                component="img"
                                sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                                src={restaurantImageUrls[0]}
                                alt={restaurant.name}
                            />
                        </Badge>
                    ) : (
                        <Box
                            sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ImageIcon sx={{ color: 'action.active' }} />
                        </Box>
                    )}
                    <Box>
                        <Typography fontWeight="medium">
                            {restaurant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ID: {restaurant.id.slice(0, 8)}...
                        </Typography>
                    </Box>
                </Box>
            </TableCell>
            <TableCell>
                {hasImages ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup max={3}>
                            {restaurantImageUrls.slice(0, 3).map((url, index) => (
                                <Avatar
                                    key={index}
                                    src={url}
                                    sx={{ width: 32, height: 32 }}
                                />
                            ))}
                        </AvatarGroup>
                        {restaurantImageUrls.length > 3 && (
                            <Chip
                                label={`+${restaurantImageUrls.length - 3}`}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Нет изображений
                    </Typography>
                )}
                {imageLoading && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
            </TableCell>
            <TableCell>
                <Chip
                    label={restaurant.cuisine}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 500
                    }}
                />
            </TableCell>
            <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {restaurant.address}
                </Typography>
            </TableCell>
            <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Управление изображениями">
                        <IconButton
                            size="small"
                            color="info"
                            onClick={() => onManageImages(restaurant)}
                        >
                            <ImageIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Управление меню">
                        <IconButton
                            component={RouterLink}
                            to={`/admin/restaurants/${restaurant.id}/menu`}
                            size="small"
                            color="info"
                        >
                            <MenuIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit(restaurant)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(restaurant)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
};

export function AdminRestaurantsPage() {
    const dispatch = useAppDispatch();
    const { list: restaurants, loading, error } = useAppSelector(state => state.restaurants);
    const allRestaurantImages = useAppSelector(state => state.restaurants.restaurantImages);
    const allImageLoading = useAppSelector(state => state.restaurants.restaurantImageLoading);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
    const [uploadingImages, setUploadingImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const [formData, setFormData] = useState<RestaurantFormData>({
        name: '',
        cuisine: '',
        address: '',
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const mountedRef = useRef(true);
    const hasFetchedRef = useRef(false);
    const imageFetchTimeoutRef = useRef<number>();
    const initialFetchDoneRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        mountedRef.current = true;

        const fetchRestaurantsData = async () => {
            if (hasFetchedRef.current) {
                return;
            }

            const cacheKey = 'admin_restaurants_loaded';
            const isLoaded = sessionStorage.getItem(cacheKey);

            if (isLoaded === 'true' && restaurants.length > 0) {
                return;
            }

            hasFetchedRef.current = true;
            sessionStorage.setItem(cacheKey, 'true');

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchRestaurants({
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

        fetchRestaurantsData();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, restaurants.length]);

    useEffect(() => {
        return () => {
            sessionStorage.removeItem('admin_restaurants_loaded');
            if (imageFetchTimeoutRef.current) {
                clearTimeout(imageFetchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const restaurantId = selectedRestaurant?.id;

        if (!restaurantId || !openImageDialog) {
            return;
        }

        if (initialFetchDoneRef.current[restaurantId]) {
            return;
        }

        const fetchImages = async () => {
            initialFetchDoneRef.current[restaurantId] = true;

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchRestaurantImages({
                    restaurantId: restaurantId,
                    cancelToken: source.token
                })).unwrap();
            } catch (err: any) {
                initialFetchDoneRef.current[restaurantId] = false;
            }
        };

        fetchImages();
    }, [selectedRestaurant?.id, openImageDialog, dispatch]);

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedRestaurants = filteredRestaurants.slice(
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

    const handleOpenAddDialog = () => {
        setSelectedRestaurant(null);
        setFormData({
            name: '',
            cuisine: '',
            address: '',
        });
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (restaurant: any) => {
        setSelectedRestaurant(restaurant);
        setFormData({
            name: restaurant.name || '',
            cuisine: restaurant.cuisine || '',
            address: restaurant.address || '',
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRestaurant(null);
    };

    const handleOpenDeleteDialog = (restaurant: any) => {
        setSelectedRestaurant(restaurant);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSelectedRestaurant(null);
    };

    const handleOpenImageDialog = useCallback((restaurant: any) => {
        if (restaurant.id) {
            initialFetchDoneRef.current[restaurant.id] = false;
        }
        setSelectedRestaurant(restaurant);
        setUploadingImages([]);
        setUploadProgress({});
        setOpenImageDialog(true);
    }, []);

    const handleCloseImageDialog = () => {
        setOpenImageDialog(false);
        setSelectedRestaurant(null);
        setUploadingImages([]);
        setUploadProgress({});

        if (imageFetchTimeoutRef.current) {
            clearTimeout(imageFetchTimeoutRef.current);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newFiles = Array.from(files).filter(file =>
            file.type.startsWith('image/')
        );

        setUploadingImages(prev => [...prev, ...newFiles]);
        event.target.value = '';
    };

    const removeUploadingImage = (index: number) => {
        setUploadingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadImages = async () => {
        const restaurantId = selectedRestaurant?.id;

        if (!restaurantId || uploadingImages.length === 0) {
            return;
        }

        try {
            const initialProgress: Record<string, number> = {};
            uploadingImages.forEach(file => {
                initialProgress[file.name] = 0;
            });
            setUploadProgress(initialProgress);

            for (const file of uploadingImages) {
                await dispatch(uploadRestaurantImage({
                    restaurantId,
                    file
                })).unwrap();

                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            }

            setSnackbar({
                open: true,
                message: `Успешно загружено ${uploadingImages.length} изображений`,
                severity: 'success'
            });

            if (imageFetchTimeoutRef.current) {
                clearTimeout(imageFetchTimeoutRef.current);
            }

            imageFetchTimeoutRef.current = setTimeout(() => {
                const source = axios.CancelToken.source();
                dispatch(fetchRestaurantImages({
                    restaurantId,
                    cancelToken: source.token
                }));
            }, 1000);

            setUploadingImages([]);
            setUploadProgress({});
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: 'Ошибка при загрузке изображений',
                severity: 'error'
            });
        }
    };

    const handleDeleteImage = async (imageName: string) => {
        const restaurantId = selectedRestaurant?.id;
        if (!restaurantId) return;

        try {
            await dispatch(deleteRestaurantImage({
                restaurantId,
                imageName
            })).unwrap();

            setSnackbar({
                open: true,
                message: 'Изображение удалено',
                severity: 'success'
            });

            if (imageFetchTimeoutRef.current) {
                clearTimeout(imageFetchTimeoutRef.current);
            }

            imageFetchTimeoutRef.current = setTimeout(() => {
                const source = axios.CancelToken.source();
                dispatch(fetchRestaurantImages({
                    restaurantId,
                    cancelToken: source.token
                }));
            }, 500);
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: 'Ошибка при удалении изображения',
                severity: 'error'
            });
        }
    };

    const handleDeleteAllImages = async () => {
        const restaurantId = selectedRestaurant?.id;
        if (!restaurantId) return;

        if (!window.confirm(`Удалить все изображения ресторана "${selectedRestaurant?.name}"?`)) {
            return;
        }

        try {
            await dispatch(deleteAllRestaurantImages(restaurantId)).unwrap();

            setSnackbar({
                open: true,
                message: 'Все изображения удалены',
                severity: 'success'
            });

            const source = axios.CancelToken.source();
            await dispatch(fetchRestaurantImages({
                restaurantId,
                cancelToken: source.token
            })).unwrap();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: 'Ошибка при удалении изображений',
                severity: 'error'
            });
        }
    };

    const handleSaveRestaurant = async () => {
        try {
            if (selectedRestaurant) {
                await dispatch(updateRestaurant({
                    id: selectedRestaurant.id,
                    name: formData.name,
                    cuisine: formData.cuisine,
                    address: formData.address,
                })).unwrap();
                setSnackbar({
                    open: true,
                    message: 'Ресторан успешно обновлен',
                    severity: 'success'
                });
            } else {
                await dispatch(createRestaurant({
                    name: formData.name,
                    cuisine: formData.cuisine,
                    address: formData.address,
                })).unwrap();
                setSnackbar({
                    open: true,
                    message: 'Ресторан успешно создан',
                    severity: 'success'
                });
            }

            hasFetchedRef.current = false;
            sessionStorage.removeItem('admin_restaurants_loaded');
            const source = axios.CancelToken.source();
            dispatch(fetchRestaurants({ cancelToken: source.token }));

            handleCloseDialog();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при сохранении ресторана',
                severity: 'error'
            });
        }
    };

    const handleDeleteRestaurant = async () => {
        if (!selectedRestaurant) return;

        try {
            await dispatch(deleteRestaurant(selectedRestaurant.id)).unwrap();
            setSnackbar({
                open: true,
                message: 'Ресторан успешно удален',
                severity: 'success'
            });

            hasFetchedRef.current = false;
            sessionStorage.removeItem('admin_restaurants_loaded');
            const source = axios.CancelToken.source();
            dispatch(fetchRestaurants({ cancelToken: source.token }));

            handleCloseDeleteDialog();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при удалении ресторана',
                severity: 'error'
            });
        }
    };

    const getRestaurantImageUrls = (restaurantId: string) => {
        const images = allRestaurantImages[restaurantId] || [];
        return images.map(imageName => getRestaurantImageUrl(restaurantId, imageName));
    };

    const getImageLoadingState = (restaurantId: string) => {
        return allImageLoading[restaurantId] || false;
    };

    const selectedRestaurantImageUrls = selectedRestaurant ? getRestaurantImageUrls(selectedRestaurant.id) : [];

    const cuisineTypes = [
        'Итальянская',
        'Японская',
        'Американская',
        'Мексиканская',
        'Индийская',
        'Русская',
        'Китайская',
        'Французская',
        'Тайская',
        'Грузинская',
        'Вегетарианская',
        'Фастфуд',
    ];

    if (loading && restaurants.length === 0) {
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

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Управление ресторанами
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Всего ресторанов: {restaurants.length}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                        sx={{ height: 40 }}
                    >
                        Добавить ресторан
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        variant="outlined"
                        placeholder="Поиск по названию, кухне или адресу..."
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
                            sessionStorage.removeItem('admin_restaurants_loaded');
                            const source = axios.CancelToken.source();
                            dispatch(fetchRestaurants({ cancelToken: source.token }));
                        }}
                        disabled={loading}
                    >
                        Обновить
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            {restaurants.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Всего ресторанов
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary">
                            {Object.values(allRestaurantImages).reduce((total, images) => total + images.length, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Всего изображений
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Название</TableCell>
                                <TableCell>Изображения</TableCell>
                                <TableCell>Кухня</TableCell>
                                <TableCell>Адрес</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedRestaurants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {searchTerm ? 'Рестораны не найдены' : 'Нет ресторанов. Добавьте первый!'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRestaurants.map((restaurant) => (
                                    <RestaurantRow
                                        key={restaurant.id}
                                        restaurant={restaurant}
                                        restaurantImageUrls={getRestaurantImageUrls(restaurant.id)}
                                        imageLoading={getImageLoadingState(restaurant.id)}
                                        onEdit={handleOpenEditDialog}
                                        onDelete={handleOpenDeleteDialog}
                                        onManageImages={handleOpenImageDialog}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {filteredRestaurants.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredRestaurants.length}
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

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedRestaurant ? 'Редактировать ресторан' : 'Добавить новый ресторан'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название ресторана *"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Тип кухни *</InputLabel>
                                <Select
                                    name="cuisine"
                                    value={formData.cuisine}
                                    label="Тип кухни *"
                                    onChange={handleSelectChange}
                                >
                                    {cuisineTypes.map((cuisine) => (
                                        <MenuItem key={cuisine} value={cuisine}>
                                            {cuisine}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Адрес *"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button
                        onClick={handleSaveRestaurant}
                        variant="contained"
                        disabled={!formData.name || !formData.cuisine || !formData.address}
                    >
                        {selectedRestaurant ? 'Обновить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openImageDialog}
                onClose={handleCloseImageDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Изображения ресторана: {selectedRestaurant?.name}
                        </Typography>
                        <IconButton onClick={handleCloseImageDialog}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedRestaurant && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                                    Существующие изображения ({selectedRestaurantImageUrls.length})
                                </Typography>
                                {getImageLoadingState(selectedRestaurant.id) ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : selectedRestaurantImageUrls.length === 0 ? (
                                    <Alert severity="info">
                                        У этого ресторана пока нет изображений
                                    </Alert>
                                ) : (
                                    <Grid container spacing={2}>
                                        {selectedRestaurantImageUrls.map((url, index) => {
                                            const imageName = decodeURIComponent(url.split('/').pop() || '');
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={index}>
                                                    <Card>
                                                        <CardMedia
                                                            component="img"
                                                            height="140"
                                                            image={url}
                                                            alt={`${selectedRestaurant.name} - ${index + 1}`}
                                                            sx={{ objectFit: 'cover' }}
                                                        />
                                                        <CardContent>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>
                                                                    {imageName}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteImage(imageName)}
                                                                >
                                                                    <DeleteForeverIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}
                                {selectedRestaurantImageUrls.length > 0 && (
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            startIcon={<DeleteForeverIcon />}
                                            color="error"
                                            variant="outlined"
                                            onClick={handleDeleteAllImages}
                                        >
                                            Удалить все изображения
                                        </Button>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                                    Загрузка новых изображений
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<UploadIcon />}
                                        fullWidth
                                    >
                                        Выбрать изображения
                                        <VisuallyHiddenInput
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileUpload}
                                        />
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Поддерживаемые форматы: JPG, PNG, GIF, WebP
                                    </Typography>
                                </Box>

                                {uploadingImages.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            Выбрано для загрузки: {uploadingImages.length} файлов
                                        </Typography>
                                        {uploadingImages.map((file, index) => {
                                            const previewUrl = URL.createObjectURL(file);
                                            const progress = uploadProgress[file.name] || 0;

                                            return (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        p: 1,
                                                        mb: 1,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        borderRadius: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                    }}
                                                >
                                                    <img
                                                        src={previewUrl}
                                                        alt={file.name}
                                                        style={{
                                                            width: 60,
                                                            height: 60,
                                                            objectFit: 'cover',
                                                            borderRadius: 4,
                                                        }}
                                                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                    />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" noWrap>
                                                            {file.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {(file.size / 1024).toFixed(1)} KB
                                                        </Typography>
                                                        {progress > 0 && (
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={progress}
                                                                sx={{ mt: 1 }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeUploadingImage(index)}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Box>
                                            );
                                        })}

                                        <Button
                                            variant="contained"
                                            startIcon={<UploadIcon />}
                                            onClick={handleUploadImages}
                                            disabled={uploadingImages.length === 0}
                                            fullWidth
                                            sx={{ mt: 2 }}
                                        >
                                            Загрузить изображения
                                        </Button>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseImageDialog}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить ресторан "{selectedRestaurant?.name}"?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Все блюда этого ресторана также будут удалены!
                    </Alert>
                    {selectedRestaurant && getRestaurantImageUrls(selectedRestaurant.id).length > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Все {getRestaurantImageUrls(selectedRestaurant.id).length} изображения этого ресторана также будут удалены
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
                    <Button onClick={handleDeleteRestaurant} color="error" variant="contained">
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