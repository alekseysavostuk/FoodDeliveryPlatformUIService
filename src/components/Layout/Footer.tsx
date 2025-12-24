import { Box, Container, Grid, Typography } from '@mui/material';
import { Phone, Email, LocationOn } from '@mui/icons-material';

export function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'grey.900',
                color: 'grey.300',
                mt: 'auto',
                py: 6,
            }}
        >
            <Container maxWidth="xl">
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" color="white" gutterBottom>
                            Доставка Минск
                        </Typography>
                        <Typography variant="body2">
                            Доставка еды из лучших ресторанов Минска.
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" color="white" gutterBottom>
                            Контакты
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Phone sx={{ fontSize: 16 }} />
                                <Typography variant="body2">+375 (29) XXX-XX-XX</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email sx={{ fontSize: 16 }} />
                                <Typography variant="body2">info@delivery-minsk.by</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ fontSize: 16 }} />
                                <Typography variant="body2">Минск, Беларусь</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" color="white" gutterBottom>
                            Время работы
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Круглосуточная доставка 24/7
                        </Typography>
                    </Grid>
                </Grid>

                <Box sx={{ borderTop: 1, borderColor: 'grey.800', mt: 4, pt: 3, textAlign: 'center' }}>
                    <Typography variant="body2">
                        &copy; 2025 Доставка Минск. Все права защищены.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}