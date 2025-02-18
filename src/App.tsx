import React from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedBooks from './components/FeaturedBooks';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { CartProvider } from './contexts/CartContext';

function App() {
  // TODO: Add proper routing
  const currentPage = window.location.pathname;

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {currentPage === '/login' ? (
          <LoginPage />
        ) : currentPage === '/register' ? (
          <RegisterPage />
        ) : (
          <>
            <Hero />
            <FeaturedBooks />
          </>
        )}
        <Toaster position="top-right" />
      </div>
    </CartProvider>
  );
}

export default App;