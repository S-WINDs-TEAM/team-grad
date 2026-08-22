import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const { loadUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(()=>{
    if(!loading && !isAuthenticated) {
      navigate('/login');

    }
  }, [loading, isAuthenticated]);
  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>Loading...</div>;

  if (!isAuthenticated) return null;
  
  return children;
};

export default ProtectedRoute;