import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Analysis from './pages/Analysis';
import MovieDetail from './pages/MovieDetail';

import { ThemeProvider } from './context/ThemeContext';

import { DataProvider } from './context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="movie/:id" element={<MovieDetail />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </DataProvider>
  );
}