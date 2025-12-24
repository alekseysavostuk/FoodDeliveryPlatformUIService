import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Card,
    CardMedia,
    CardContent,
    Button,
    Box,
    Chip,
    Grid,
    IconButton,
    CircularProgress,
    Fab,
    Paper,
    Pagination,
    Stack,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from '@mui/material';
import {
    ArrowBack,
    Star,
    LocationOn,
    Add,
    ShoppingCart,
    RestaurantMenu,
    NavigateBefore,
    NavigateNext,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
    fetchRestaurantById,
    fetchDishes,
    getDishImageUrl,
    getRestaurantImageUrl,
    fetchRestaurantImages,
} from '../redux/slices/restaurantsSlice';
import { addToCart } from '../redux/slices/cartSlice';
import axios from 'axios';

const ITEMS_PER_PAGE_OPTIONS = [4, 8, 12, 24];

interface RestaurantImageCarouselProps {
    restaurantId: string;
    restaurantName: string;
    imageNames: string[];
}

const RestaurantImageCarousel: React.FC<RestaurantImageCarouselProps> = ({
                                                                             restaurantId,
                                                                             restaurantName,
                                                                             imageNames
                                                                         }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    if (imageNames.length === 0) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.50',
                }}
            >
                <Box
                    component="img"
                    src="https://placehold.co/800x400/e0e0e0/9e9e9e?text=Нет+изображения+ресторана"
                    alt="Нет изображения ресторана"
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </Box>
        );
    }

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imageNames.length);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? imageNames.length - 1 : prev - 1
        );
    };

    const handleImageLoad = (index: number) => {
        setLoadedImages(prev => new Set(prev).add(index));
    };

    const currentImageUrl = getRestaurantImageUrl(restaurantId, imageNames[currentImageIndex]);
    const isCurrentImageLoaded = loadedImages.has(currentImageIndex);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
            <CardMedia
                component="img"
                image={currentImageUrl}
                alt={`${restaurantName} - ${currentImageIndex + 1}`}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s',
                    opacity: isCurrentImageLoaded ? 1 : 0,
                }}
                onLoad={() => handleImageLoad(currentImageIndex)}
            />

            {!isCurrentImageLoaded && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.50',
                    }}
                >
                    <CircularProgress size={40} />
                </Box>
            )}

            {imageNames.length > 1 && (
                <>
                    <IconButton
                        size="medium"
                        onClick={handlePrev}
                        sx={{
                            position: 'absolute',
                            left: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                                transform: 'translateY(-50%) scale(1.1)'
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <NavigateBefore />
                    </IconButton>

                    <IconButton
                        size="medium"
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                                transform: 'translateY(-50%) scale(1.1)'
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <NavigateNext />
                    </IconButton>
                </>
            )}

            {imageNames.length > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.5,
                    }}
                >
                    {imageNames.map((_, index) => (
                        <Box
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: index === currentImageIndex ? 'primary.main' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    bgcolor: index === currentImageIndex ? 'primary.main' : 'rgba(255,255,255,0.8)',
                                    transform: 'scale(1.2)',
                                },
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

interface DishImageCarouselProps {
    dishId: string;
    dishName: string;
    imageNames: string[];
}

const DishImageCarousel: React.FC<DishImageCarouselProps> = ({
                                                                 dishId,
                                                                 dishName,
                                                                 imageNames
                                                             }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    if (imageNames.length === 0) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                }}
            >
                <Box
                    component="img"
                    src="https://placehold.co/400x200/e0e0e0/9e9e9e?text=Нет+изображения"
                    alt="Нет изображения блюда"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 1,
                    }}
                />
            </Box>
        );
    }

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imageNames.length);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? imageNames.length - 1 : prev - 1
        );
    };

    const handleImageLoad = (index: number) => {
        setLoadedImages(prev => new Set(prev).add(index));
    };

    const currentImageUrl = getDishImageUrl(dishId, imageNames[currentImageIndex]);
    const isCurrentImageLoaded = loadedImages.has(currentImageIndex);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
            <CardMedia
                component="img"
                image={currentImageUrl}
                alt={`${dishName} - ${currentImageIndex + 1}`}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 1,
                    transition: 'opacity 0.3s',
                    opacity: isCurrentImageLoaded ? 1 : 0,
                }}
                onLoad={() => handleImageLoad(currentImageIndex)}
            />

            {!isCurrentImageLoaded && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                    }}
                >
                    <CircularProgress size={24} />
                </Box>
            )}

            {imageNames.length > 1 && (
                <>
                    <IconButton
                        size="small"
                        onClick={handlePrev}
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                    >
                        <NavigateBefore />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        }}
                    >
                        <NavigateNext />
                    </IconButton>
                </>
            )}

            {imageNames.length > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.5,
                    }}
                >
                    {imageNames.map((_, index) => (
                        <Box
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: index === currentImageIndex ? 'primary.main' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s',
                                '&:hover': {
                                    bgcolor: index === currentImageIndex ? 'primary.main' : 'rgba(255,255,255,0.8)',
                                },
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export function MenuPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { selectedRestaurant, dishes, loading } = useAppSelector(state => state.restaurants);
    const allDishImages = useAppSelector(state => state.restaurants.dishImages);
    const restaurantImages = useAppSelector(state =>
        id ? state.restaurants.restaurantImages[id] || [] : []
    );

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!id) return;

        const source = axios.CancelToken.source();

        const fetchData = async () => {
            try {
                await Promise.all([
                    dispatch(fetchRestaurantById({ id, cancelToken: source.token })),
                    dispatch(fetchDishes({ restaurantId: id, cancelToken: source.token })),
                    dispatch(fetchRestaurantImages({ restaurantId: id, cancelToken: source.token }))
                ]);
            } catch (error) {
                if (axios.isCancel(error)) {
                    return;
                }
                console.error('Ошибка загрузки:', error);
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
            source.cancel('Запрос отменен');
        };
    }, [id, dispatch]);

    const getDishImages = (dishId: string) => {
        return allDishImages[dishId] || [];
    };

    const handleAddToCart = (dish: any) => {
        if (!id) return;

        const dishImages = getDishImages(dish.id);
        const mainImage = dishImages.length > 0
            ? getDishImageUrl(dish.id, dishImages[0])
            : 'https://placehold.co/300x200/e0e0e0/9e9e9e?text=No+Image';

        dispatch(addToCart({
            dishId: dish.id,
            restaurantId: id,
            name: dish.name,
            price: dish.price,
            quantity: 1,
            image: mainImage,
        }));
    };

    const totalPages = Math.ceil(dishes.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDishes = dishes.slice(startIndex, endIndex);

    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [dishes.length, itemsPerPage, totalPages, page]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (event: any) => {
        const newItemsPerPage = Number(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    if (loading) {
        return (
            <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!selectedRestaurant) {
        return (
            <Container sx={{ py: 8 }}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Ресторан не найден
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/')}>
                        Вернуться к списку ресторанов
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{ mb: 3 }}
            >
                Назад к ресторанам
            </Button>

            <Card
                sx={{
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 3,
                }}
            >
                <RestaurantImageCarousel
                    restaurantId={selectedRestaurant.id}
                    restaurantName={selectedRestaurant.name}
                    imageNames={restaurantImages}
                />
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        {selectedRestaurant.name}
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                        {selectedRestaurant.cuisine}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                        {selectedRestaurant.rating && (
                            <Chip
                                icon={<Star sx={{ fill: '#fbbf24' }} />}
                                label={selectedRestaurant.rating.toFixed(1)}
                                variant="filled"
                                sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}
                            />
                        )}
                        {selectedRestaurant.address && (
                            <Chip
                                icon={<LocationOn />}
                                label={selectedRestaurant.address}
                                variant="outlined"
                                color="primary"
                            />
                        )}
                    </Box>
                </CardContent>
            </Card>

            <Paper
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    boxShadow: 1,
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3
                }}>
                    <Box>
                        <Typography variant="h5" component="h2" fontWeight="bold">
                            Меню
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Выберите понравившиеся блюда
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Всего блюд: {dishes.length}
                        </Typography>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id="items-per-page-label">На странице</InputLabel>
                            <Select
                                labelId="items-per-page-label"
                                value={itemsPerPage}
                                label="На странице"
                                onChange={handleItemsPerPageChange}
                                size="small"
                            >
                                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {dishes.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center', mt: 2 }}>
                        <RestaurantMenu sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            Меню пока пусто
                        </Typography>
                    </Paper>
                ) : (
                    <Box>
                        <Grid container spacing={3}>
                            {paginatedDishes.map((dish: any) => {
                                const dishImages = getDishImages(dish.id);

                                return (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={dish.id}>
                                        <Card
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                borderRadius: 2,
                                                transition: 'all 0.3s ease',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    boxShadow: 6,
                                                    transform: 'translateY(-8px)',
                                                    '& .dish-image': {
                                                        transform: 'scale(1.05)',
                                                    }
                                                },
                                            }}
                                        >
                                            <Box sx={{ height: 200, overflow: 'hidden' }}>
                                                <DishImageCarousel
                                                    dishId={dish.id}
                                                    dishName={dish.name}
                                                    imageNames={dishImages}
                                                />
                                            </Box>

                                            <CardContent sx={{
                                                flex: 1,
                                                p: 2.5,
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                <Typography
                                                    variant="h6"
                                                    gutterBottom
                                                    noWrap
                                                    fontWeight="medium"
                                                >
                                                    {dish.name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        flexGrow: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        mb: 2,
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {dish.description}
                                                </Typography>

                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    mt: 'auto',
                                                    pt: 1,
                                                    borderTop: 1,
                                                    borderColor: 'divider'
                                                }}>
                                                    <Typography
                                                        variant="h6"
                                                        color="primary"
                                                        fontWeight="bold"
                                                    >
                                                        {dish.price} ₽
                                                    </Typography>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleAddToCart(dish)}
                                                        sx={{
                                                            bgcolor: 'primary.main',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: 'primary.dark',
                                                                transform: 'scale(1.1)'
                                                            },
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <Add />
                                                    </IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {totalPages > 1 && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mt: 4,
                                pt: 3,
                                borderTop: 1,
                                borderColor: 'divider'
                            }}>
                                <Stack spacing={2} alignItems="center">
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="large"
                                        showFirstButton
                                        showLastButton
                                        siblingCount={1}
                                        boundaryCount={1}
                                    />

                                    <Typography variant="body2" color="text.secondary">
                                        Показано {startIndex + 1}-{Math.min(endIndex, dishes.length)} из {dishes.length} блюд
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            <Fab
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    width: 56,
                    height: 56,
                    boxShadow: 3,
                    '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: 6,
                    },
                    transition: 'all 0.2s',
                }}
                onClick={() => navigate('/cart')}
            >
                <ShoppingCart />
            </Fab>
        </Container>
    );
}