import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Box,
    Paper,
    Chip,
} from '@mui/material';
import {
    Store,
    People,
    Shield,
    Person,
} from '@mui/icons-material';
import { useAppSelector } from '../../redux/hooks';

export function AdminDashboard() {
    const { user } = useAppSelector(state => state.auth);
    const { list: restaurants } = useAppSelector(state => state.restaurants);
    const { allUsers: users } = useAppSelector(state => state.profile);

    const stats = [
        {
            title: 'Рестораны',
            count: restaurants.length,
            icon: <Store sx={{ fontSize: 40, color: 'primary.main' }} />,
            link: '/admin/restaurants',
            color: 'primary',
        },
        {
            title: 'Пользователи',
            count: users.length,
            icon: <People sx={{ fontSize: 40, color: 'secondary.main' }} />,
            link: '/admin/users',
            color: 'secondary',
        },
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Shield sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight="bold" color="text.primary">
                        Админ-панель
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Управление системой доставки еды
                    </Typography>
                </Box>
            </Box>

            {user && (
                <Paper
                    elevation={1}
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: 'primary.50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid',
                                borderColor: 'primary.100',
                            }}
                        >
                            <Person sx={{ fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {user.name || 'Администратор'}
                            </Typography>
                            <Chip
                                icon={<Shield sx={{ fontSize: 16 }} />}
                                label={user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                                size="small"
                                color={user.role === 'ADMIN' ? 'primary' : 'default'}
                                sx={{
                                    fontWeight: 'medium',
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
            )}

            <Grid container spacing={3}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Card
                            elevation={1}
                            sx={{
                                height: '100%',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderColor: 'primary.light',
                                }
                            }}
                        >
                            <CardActionArea
                                component={RouterLink}
                                to={stat.link}
                                sx={{
                                    height: '100%',
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography
                                                variant="h2"
                                                fontWeight="bold"
                                                sx={{
                                                    fontSize: '3rem',
                                                    lineHeight: 1,
                                                    mb: 1,
                                                    color: 'text.primary'
                                                }}
                                            >
                                                {stat.count}
                                            </Typography>
                                            <Typography
                                                variant="h6"
                                                color="text.secondary"
                                                sx={{
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {stat.title}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 70,
                                                height: 70,
                                                borderRadius: '50%',
                                                bgcolor: `${stat.color}.50`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid',
                                                borderColor: `${stat.color}.100`,
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}