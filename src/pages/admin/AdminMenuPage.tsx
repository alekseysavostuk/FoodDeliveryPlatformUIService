import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    CardMedia,
    Chip,
    Avatar,
    AvatarGroup,
    Badge,
    LinearProgress,
    Card,
    CardContent,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    Fastfood as FoodIcon,
    CloudUpload as UploadIcon,
    Image as ImageIcon,
    Close as CloseIcon,
    DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    fetchRestaurantById,
    fetchDishes,
    createDish,
    updateDish,
    deleteDish,
    uploadDishImage,
    deleteDishImage,
    deleteAllDishImages,
    fetchDishImages,
    getDishImageUrl,
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

interface DishRowProps {
    dish: any;
    dishImageUrls: string[];
    imageLoading: boolean;
    onEdit: (dish: any) => void;
    onDelete: (dish: any) => void;
    onManageImages: (dish: any) => void;
}

const DishRow: React.FC<DishRowProps> = ({
                                             dish,
                                             dishImageUrls,
                                             imageLoading,
                                             onEdit,
                                             onDelete,
                                             onManageImages
                                         }) => {
    const hasImages = dishImageUrls.length > 0;

    return (
        <TableRow hover>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {hasImages ? (
                        <Badge
                            badgeContent={dishImageUrls.length}
                            color="primary"
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                        >
                            <CardMedia
                                component="img"
                                sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                                src={dishImageUrls[0]}
                                alt={dish.name}
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
                            {dish.name}
                        </Typography>
                    </Box>
                </Box>
            </TableCell>
            <TableCell>
                {hasImages ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup max={3}>
                            {dishImageUrls.slice(0, 3).map((url, index) => (
                                <Avatar
                                    key={index}
                                    src={url}
                                    sx={{ width: 32, height: 32 }}
                                />
                            ))}
                        </AvatarGroup>
                        {dishImageUrls.length > 3 && (
                            <Chip
                                label={`+${dishImageUrls.length - 3}`}
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
                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {dish.description}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography fontWeight="bold" color="primary">
                    {dish.price} ₽
                </Typography>
            </TableCell>
            <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Управление изображениями">
                        <IconButton
                            size="small"
                            color="info"
                            onClick={() => onManageImages(dish)}
                        >
                            <ImageIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit(dish)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(dish)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );
};

export function AdminMenuPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { selectedRestaurant, dishes, loading, error } = useAppSelector(state => state.restaurants);
    const allDishImages = useAppSelector(state => state.restaurants.dishImages);
    const allImageLoading = useAppSelector(state => state.restaurants.dishImageLoading);

    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedDish, setSelectedDish] = useState<any>(null);
    const [uploadingImages, setUploadingImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const mountedRef = useRef(true);
    const hasFetchedRestaurantRef = useRef(false);
    const hasFetchedDishesRef = useRef(false);
    const imageFetchTimeoutRef = useRef<number>();
    const initialFetchDoneRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        if (!id) {
            return;
        }

        mountedRef.current = true;

        const fetchRestaurantData = async () => {
            const cacheKey = `admin_restaurant_${id}_loaded`;
            const isLoaded = sessionStorage.getItem(cacheKey);

            if (isLoaded === 'true' && selectedRestaurant) {
                return;
            }

            if (hasFetchedRestaurantRef.current) {
                return;
            }

            hasFetchedRestaurantRef.current = true;
            sessionStorage.setItem(cacheKey, 'true');

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchRestaurantById({
                    id: id,
                    cancelToken: source.token
                }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    hasFetchedRestaurantRef.current = false;
                    sessionStorage.removeItem(cacheKey);
                    return;
                }
                hasFetchedRestaurantRef.current = false;
                sessionStorage.removeItem(cacheKey);
            }
        };

        const fetchDishesData = async () => {
            const cacheKey = `admin_dishes_${id}_loaded`;
            const isLoaded = sessionStorage.getItem(cacheKey);

            if (isLoaded === 'true' && dishes.length > 0) {
                return;
            }

            if (hasFetchedDishesRef.current) {
                return;
            }

            hasFetchedDishesRef.current = true;
            sessionStorage.setItem(cacheKey, 'true');

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchDishes({
                    restaurantId: id,
                    cancelToken: source.token
                }));
            } catch (error) {
                if (axios.isCancel(error)) {
                    hasFetchedDishesRef.current = false;
                    sessionStorage.removeItem(cacheKey);
                    return;
                }
                hasFetchedDishesRef.current = false;
                sessionStorage.removeItem(cacheKey);
            }
        };

        fetchRestaurantData();
        fetchDishesData();

        return () => {
            mountedRef.current = false;
        };
    }, [dispatch, id, selectedRestaurant, dishes.length]);

    useEffect(() => {
        return () => {
            if (id) {
                sessionStorage.removeItem(`admin_restaurant_${id}_loaded`);
                sessionStorage.removeItem(`admin_dishes_${id}_loaded`);
            }
            if (imageFetchTimeoutRef.current) {
                clearTimeout(imageFetchTimeoutRef.current);
            }
        };
    }, [id]);

    useEffect(() => {
        const dishId = selectedDish?.id;

        if (!dishId || !openImageDialog) {
            return;
        }

        if (initialFetchDoneRef.current[dishId]) {
            return;
        }

        const fetchImages = async () => {
            initialFetchDoneRef.current[dishId] = true;

            const source = axios.CancelToken.source();

            try {
                await dispatch(fetchDishImages({
                    dishId: dishId,
                    cancelToken: source.token
                })).unwrap();
            } catch (err: any) {
                initialFetchDoneRef.current[dishId] = false;
            }
        };

        fetchImages();
    }, [selectedDish?.id, openImageDialog, dispatch]);

    const handleOpenAddDialog = () => {
        setSelectedDish(null);
        setFormData({
            name: '',
            description: '',
            price: '',
        });
        setUploadingImages([]);
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (dish: any) => {
        setSelectedDish(dish);
        setFormData({
            name: dish.name || '',
            description: dish.description || '',
            price: dish.price?.toString() || '',
        });
        setUploadingImages([]);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDish(null);
        setUploadingImages([]);
        setUploadProgress({});
    };

    const handleOpenDeleteDialog = (dish: any) => {
        setSelectedDish(dish);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSelectedDish(null);
    };

    const handleOpenImageDialog = useCallback((dish: any) => {
        if (dish.id) {
            initialFetchDoneRef.current[dish.id] = false;
        }
        setSelectedDish(dish);
        setUploadingImages([]);
        setUploadProgress({});
        setOpenImageDialog(true);
    }, []);

    const handleCloseImageDialog = () => {
        setOpenImageDialog(false);
        setSelectedDish(null);
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
        const dishId = selectedDish?.id;

        if (!dishId || uploadingImages.length === 0) {
            return;
        }

        try {
            const initialProgress: Record<string, number> = {};
            uploadingImages.forEach(file => {
                initialProgress[file.name] = 0;
            });
            setUploadProgress(initialProgress);

            for (const file of uploadingImages) {
                await dispatch(uploadDishImage({
                    dishId,
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
                dispatch(fetchDishImages({
                    dishId,
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
        const dishId = selectedDish?.id;
        if (!dishId) return;

        try {
            await dispatch(deleteDishImage({
                dishId,
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
                dispatch(fetchDishImages({
                    dishId,
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
        const dishId = selectedDish?.id;
        if (!dishId) return;

        if (!window.confirm(`Удалить все изображения блюда "${selectedDish?.name}"?`)) {
            return;
        }

        try {
            await dispatch(deleteAllDishImages(dishId)).unwrap();

            setSnackbar({
                open: true,
                message: 'Все изображения удалены',
                severity: 'success'
            });

            const source = axios.CancelToken.source();
            await dispatch(fetchDishImages({
                dishId,
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

    const handleCreateDish = async () => {
        if (!id) return;

        try {
            await dispatch(createDish({
                restaurantId: id,
                data: {
                    name: formData.name,
                    description: formData.description,
                    price: formData.price,
                }
            })).unwrap();

            setSnackbar({
                open: true,
                message: 'Блюдо успешно создано',
                severity: 'success'
            });

            hasFetchedDishesRef.current = false;
            sessionStorage.removeItem(`admin_dishes_${id}_loaded`);
            const source = axios.CancelToken.source();
            dispatch(fetchDishes({
                restaurantId: id,
                cancelToken: source.token
            }));

            handleCloseDialog();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при создании блюда',
                severity: 'error'
            });
        }
    };

    const handleUpdateDish = async () => {
        if (!selectedDish) return;

        try {
            await dispatch(updateDish({
                id: selectedDish.id,
                name: formData.name,
                description: formData.description,
                price: formData.price,
            })).unwrap();

            setSnackbar({
                open: true,
                message: 'Блюдо успешно обновлено',
                severity: 'success'
            });

            if (id) {
                hasFetchedDishesRef.current = false;
                sessionStorage.removeItem(`admin_dishes_${id}_loaded`);
                const source = axios.CancelToken.source();
                dispatch(fetchDishes({
                    restaurantId: id,
                    cancelToken: source.token
                }));
            }

            handleCloseDialog();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при обновлении блюда',
                severity: 'error'
            });
        }
    };

    const handleDeleteDish = async () => {
        if (!selectedDish || !id) return;

        try {
            await dispatch(deleteDish(selectedDish.id)).unwrap();

            setSnackbar({
                open: true,
                message: 'Блюдо успешно удалено',
                severity: 'success'
            });

            hasFetchedDishesRef.current = false;
            sessionStorage.removeItem(`admin_dishes_${id}_loaded`);
            const source = axios.CancelToken.source();
            dispatch(fetchDishes({
                restaurantId: id,
                cancelToken: source.token
            }));

            handleCloseDeleteDialog();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err || 'Ошибка при удалении блюда',
                severity: 'error'
            });
        }
    };

    const handleSaveDish = () => {
        if (selectedDish) {
            handleUpdateDish();
        } else {
            handleCreateDish();
        }
    };

    const getDishImageUrls = (dishId: string) => {
        if (!dishId) {
            return [];
        }
        const images = allDishImages[dishId] || [];
        return images.map(imageName => getDishImageUrl(dishId, imageName));
    };

    const getImageLoadingState = (dishId: string) => {
        if (!dishId) {
            return false;
        }
        return allImageLoading[dishId] || false;
    };

    const selectedDishImageUrls = selectedDish ? getDishImageUrls(selectedDish.id) : [];

    if (loading) {
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
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/restaurants')}
                    sx={{ mt: 2 }}
                >
                    Назад к ресторанам
                </Button>
            </Container>
        );
    }

    if (!selectedRestaurant) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="warning">
                    Ресторан не найден
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/restaurants')}
                    sx={{ mt: 2 }}
                >
                    Назад к ресторанам
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/restaurants')}
                    sx={{ mb: 2 }}
                >
                    Назад к ресторанам
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Управление меню
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Ресторан: {selectedRestaurant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedRestaurant.cuisine} • {selectedRestaurant.address}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                    >
                        Добавить блюдо
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            {dishes.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Всего блюд
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary">
                            {Object.values(allDishImages).reduce((total, images) => total + images.length, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Всего изображений
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Название</TableCell>
                                <TableCell>Изображения</TableCell>
                                <TableCell>Описание</TableCell>
                                <TableCell>Цена</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dishes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <FoodIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary">
                                            Нет блюд в меню. Добавьте первое блюдо!
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dishes.map((dish) => (
                                    <DishRow
                                        key={dish.id}
                                        dish={dish}
                                        dishImageUrls={getDishImageUrls(dish.id)}
                                        imageLoading={getImageLoadingState(dish.id)}
                                        onEdit={handleOpenEditDialog}
                                        onDelete={handleOpenDeleteDialog}
                                        onManageImages={handleOpenImageDialog}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedDish ? 'Редактировать блюдо' : 'Добавить новое блюдо'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название блюда"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Описание"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                multiline
                                rows={3}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Цена (₽)"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button
                        onClick={handleSaveDish}
                        variant="contained"
                        disabled={!formData.name || !formData.price}
                    >
                        {selectedDish ? 'Обновить' : 'Создать'}
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
                            Изображения блюда: {selectedDish?.name}
                        </Typography>
                        <IconButton onClick={handleCloseImageDialog}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedDish && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                                    Существующие изображения ({selectedDishImageUrls.length})
                                </Typography>
                                {getImageLoadingState(selectedDish.id) ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : selectedDishImageUrls.length === 0 ? (
                                    <Alert severity="info">
                                        У этого блюда пока нет изображений
                                    </Alert>
                                ) : (
                                    <Grid container spacing={2}>
                                        {selectedDishImageUrls.map((url, index) => {
                                            const imageName = decodeURIComponent(url.split('/').pop() || '');
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={index}>
                                                    <Card>
                                                        <CardMedia
                                                            component="img"
                                                            height="140"
                                                            image={url}
                                                            alt={`${selectedDish.name} - ${index + 1}`}
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
                                {selectedDishImageUrls.length > 0 && (
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
                        Вы уверены, что хотите удалить блюдо "{selectedDish?.name}"?
                    </Typography>
                    {selectedDish && getDishImageUrls(selectedDish.id).length > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Все {getDishImageUrls(selectedDish.id).length} изображения этого блюда также будут удалены
                        </Alert>
                    )}
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Это действие нельзя отменить
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
                    <Button onClick={handleDeleteDish} color="error" variant="contained">
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