import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED_WIDTH = 72;

const AppLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', lg: `calc(100% - ${DRAWER_COLLAPSED_WIDTH}px)` },
          mt: 8,
          transition: 'width 0.3s ease, margin 0.3s ease',
          bgcolor: (theme) => theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;