import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import Learn from './pages/Learn';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },           
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'learn',
        element: (
          <ProtectedRoute>
            <Learn />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profiles',
        element: (
          <ProtectedRoute>
            <Profiles />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);