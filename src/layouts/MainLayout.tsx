import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const MainLayout: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <LocalShippingIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Доставка Минск
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container component="main" sx={{ flex: 1, py: 4 }}>
                <Outlet />
            </Container>

            <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 3, mt: 'auto' }}>
                <Container>
                    <Typography variant="body2" align="center">
                        © {new Date().getFullYear()} Доставка Минск. Все права защищены.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout;