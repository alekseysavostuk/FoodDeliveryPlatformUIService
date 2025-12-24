import { useEffect, useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Box,
    Chip,
    Button,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Paper,
    Pagination,
    Stack,
    IconButton,
} from '@mui/material';
import {
    Star,
    FilterList,
    Restaurant,
    NavigateBefore,
    NavigateNext,
    Panorama,
    LocationOn,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
    fetchRestaurants,
    setFilters,
    selectAllRestaurantImages,
    getRestaurantImageUrl,
} from '../redux/slices/restaurantsSlice';
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

    if (imageNames.length === 0) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                }}
            >
                <Panorama sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
        );
    }

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % imageNames.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) =>
            prev === 0 ? imageNames.length - 1 : prev - 1
        );
    };

    const handleDotClick = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    const currentImageUrl = getRestaurantImageUrl(restaurantId, imageNames[currentImageIndex]);

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: 160,
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <Box
                component="img"
                src={currentImageUrl}
                alt={`${restaurantName} - ${currentImageIndex + 1}`}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />

            {imageNames.length > 1 && (
                <>
                    <IconButton
                        size="small"
                        onClick={handlePrev}
                        sx={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            width: 24,
                            height: 24,
                        }}
                    >
                        <NavigateBefore sx={{ fontSize: 16 }} />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            width: 24,
                            height: 24,
                        }}
                    >
                        <NavigateNext sx={{ fontSize: 16 }} />
                    </IconButton>
                </>
            )}

            {imageNames.length > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.3,
                    }}
                >
                    {imageNames.map((_, index) => (
                        <Box
                            key={index}
                            onClick={(e) => handleDotClick(e, index)}
                            sx={{
                                width: 6,
                                height: 6,
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

            {imageNames.length > 0 && (
                <Chip
                    size="small"
                    label={`${currentImageIndex + 1}/${imageNames.length}`}
                    sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                    }}
                />
            )}
        </Box>
    );
};

interface RestaurantFilters {
    cuisine: string;
}

export function RestaurantListPage() {
    const dispatch = useAppDispatch();
    const { list: restaurants, loading, filters } = useAppSelector(state => state.restaurants);

    const allRestaurantImages = useAppSelector(selectAllRestaurantImages);
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState<RestaurantFilters>(filters);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const source = axios.CancelToken.source();

        const fetchData = async () => {
            try {
                await dispatch(fetchRestaurants({ ...filters, cancelToken: source.token }));
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
    }, [dispatch, filters]);

    const handleApplyFilters = () => {
        dispatch(setFilters(localFilters));
        setShowFilters(false);
        setPage(1);
    };

    const handleResetFilters = () => {
        const resetFilters: RestaurantFilters = { cuisine: '' };
        setLocalFilters(resetFilters);
        dispatch(setFilters(resetFilters));
        setPage(1);
    };

    const filteredRestaurants = restaurants.filter(restaurant => {
        if (filters.cuisine && restaurant.cuisine !== filters.cuisine) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);

    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [filteredRestaurants.length, itemsPerPage, totalPages, page]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (event: any) => {
        const newItemsPerPage = Number(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    const handleCuisineChange = (event: any) => {
        setLocalFilters({ ...localFilters, cuisine: event.target.value });
    };

    const getRestaurantImages = (restaurantId: string) => {
        return allRestaurantImages[restaurantId] || [];
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Рестораны рядом с вами
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Выберите ресторан и закажите любимые блюда с доставкой
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Restaurant sx={{ color: 'primary.main' }} />
                        <Typography variant="body1">
                            Найдено ресторанов: <strong>{filteredRestaurants.length}</strong>
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>На странице</InputLabel>
                            <Select
                                value={itemsPerPage}
                                label="На странице"
                                onChange={handleItemsPerPageChange}
                            >
                                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                        </Button>
                    </Box>
                </Box>

                <Collapse in={showFilters}>
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Тип кухни</InputLabel>
                                    <Select
                                        value={localFilters.cuisine}
                                        label="Тип кухни"
                                        onChange={handleCuisineChange}
                                    >
                                        <MenuItem value="">Все кухни</MenuItem>
                                        <MenuItem value="Итальянская">Итальянская</MenuItem>
                                        <MenuItem value="Японская">Японская</MenuItem>
                                        <MenuItem value="Американская">Американская</MenuItem>
                                        <MenuItem value="Мексиканская">Мексиканская</MenuItem>
                                        <MenuItem value="Индийская">Индийская</MenuItem>
                                        <MenuItem value="Русская">Русская</MenuItem>
                                        <MenuItem value="Китайская">Китайская</MenuItem>
                                        <MenuItem value="Французская">Французская</MenuItem>
                                        <MenuItem value="Тайская">Тайская</MenuItem>
                                        <MenuItem value="Грузинская">Грузинская</MenuItem>
                                        <MenuItem value="Вегетарианская">Вегетарианская</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={handleResetFilters}>
                                Сбросить фильтры
                            </Button>
                            <Button variant="contained" onClick={handleApplyFilters}>
                                Применить фильтры
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && filteredRestaurants.length > 0 && (
                <>
                    <Grid container spacing={3}>
                        {paginatedRestaurants.map(restaurant => {
                            const restaurantImages = getRestaurantImages(restaurant.id);

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={restaurant.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4,
                                            },
                                        }}
                                    >
                                        <CardActionArea
                                            component={RouterLink}
                                            to={`/restaurant/${restaurant.id}`}
                                            sx={{ flex: 1 }}
                                        >
                                            <Box sx={{ height: 160, overflow: 'hidden' }}>
                                                <RestaurantImageCarousel
                                                    restaurantId={restaurant.id}
                                                    restaurantName={restaurant.name}
                                                    imageNames={restaurantImages}
                                                />
                                            </Box>
                                            <CardContent sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom noWrap>
                                                    {restaurant.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                                                    {restaurant.cuisine}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                                    {restaurant.rating && (
                                                        <Chip
                                                            icon={<Star sx={{ fill: '#fbbf24' }} />}
                                                            label={restaurant.rating.toFixed(1)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                </Box>
                                                {restaurant.address && (
                                                    <Chip
                                                        icon={<LocationOn />}
                                                        label={restaurant.address}
                                                        variant="outlined"
                                                        color="primary"
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mt: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 2
                            }}
                        >
                            <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="large"
                                    showFirstButton
                                    showLastButton
                                />

                                <Typography variant="body2" color="text.secondary">
                                    Показано {startIndex + 1}-{Math.min(endIndex, filteredRestaurants.length)} из {filteredRestaurants.length} ресторанов
                                </Typography>
                            </Stack>
                        </Paper>
                    )}
                </>
            )}

            {!loading && filteredRestaurants.length === 0 && (
                <Paper sx={{ p: 8, textAlign: 'center', mt: 3 }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        Рестораны не найдены
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Попробуйте изменить параметры фильтрации
                    </Typography>
                    <Button variant="contained" onClick={handleResetFilters} sx={{ mt: 2 }}>
                        Сбросить все фильтры
                    </Button>
                </Paper>
            )}
        </Container>
    );
}