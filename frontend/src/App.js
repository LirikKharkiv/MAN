/**
 * The App function sets up routes for different components with lazy loading and authentication checks
 * using React Router.
 * @returns The `App` component is being returned, which contains the routing setup for different paths
 * in the application. It includes lazy loading components for Login, Signup, Home, Profile,
 * TestCreate, TestGo, and TestPage. PrivateRoute component is used to protect routes that require
 * authentication. The app is wrapped in ThemeToggleProvider and AuthProvider for theme and
 * authentication context respectively.
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeToggleProvider } from './components/Home/ThemeContext.js';
import { AuthProvider, useAuth } from './components/Login-Signup/AuthContext.js';

// Lazy loading components
const Login = lazy(() => import('./components/Login-Signup/Login.js'));
const Signup = lazy(() => import('./components/Login-Signup/Signup.js'));
const Home = lazy(() => import('./components/Home/Home.js'));
const Profile = lazy(() => import('./components/Profile/Profile.js'));
const TestCreate = lazy(() => import('./components/Test-Create/TestCreate.js'));
const TestGo = lazy(() => import('./components/Test-Create/TestGo.js'));
const TestPage = lazy(() => import('./components/Test-Create/TestPage.js'));

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <ThemeToggleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}> {/* Loading state */}
            <Routes>
              <Route path='/' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/home' element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />
              <Route path='/profile' element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path='/testcreate' element={
                <PrivateRoute>
                  <TestCreate />
                </PrivateRoute>
              } />
              <Route path='/testgo' element={
                <PrivateRoute>
                  <TestGo />
                </PrivateRoute>
              } />
              <Route path='/test/:code' element={
                <PrivateRoute>
                  <TestPage />
                </PrivateRoute>
              } />
              <Route path='*' element={<div>404 Not Found</div>} /> {/* 404 Page */}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeToggleProvider>
  );
}

export default App;
