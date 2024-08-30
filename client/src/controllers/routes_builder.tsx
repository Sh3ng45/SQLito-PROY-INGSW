import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Viewer from './viewer';
import Login from './login';
import { useAuth } from '@models/authContext/authContext';

const RouterBuilder = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/viewer" element={isAuthenticated ? <Viewer /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/viewer" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterBuilder;
