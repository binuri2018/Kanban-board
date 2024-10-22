import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles'; 
import authUtils from '../../utils/authUtils';
import Loading from '../common/Loading';
import Sidebar from '../common/Sidebar';
import { setUser } from '../../redux/features/userSlice';

const AppLayout = ({ darkTheme }) => {  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authUtils.isAuthenticated();
      if (!user) {
        navigate('/login');
      } else {
        // save user
        dispatch(setUser(user));
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    loading ? (
      <Loading fullHeight />
    ) : (
      <Box sx={{ display: 'flex' }}>
        <ThemeProvider theme={darkTheme}>
          <Sidebar />
        </ThemeProvider>
        
        <Box sx={{
          flexGrow: 1,
          p: 1,
          width: 'max-content'
        }}>
          <Outlet />
        </Box>
      </Box>
    )
  );
};

export default AppLayout;
