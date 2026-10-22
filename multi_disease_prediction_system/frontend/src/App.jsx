import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HeartPredictionPage from './pages/HeartPredictionPage';
import DiabetesPredictionPage from './pages/DiabetesPredictionPage';
import ParkinsonsPredictionPage from './pages/ParkinsonsPredictionPage';
import LiverPredictionPage from './pages/LiverPredictionPage';
import HistoryPage from './pages/HistoryPage';
import WhatIfPage from './pages/WhatIfPage';
import CrossRiskPage from './pages/CrossRiskPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Main app wrapped in dashboard Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="predict/heart" element={<HeartPredictionPage />} />
        <Route path="predict/diabetes" element={<DiabetesPredictionPage />} />
        <Route path="predict/parkinsons" element={<ParkinsonsPredictionPage />} />
        <Route path="predict/liver" element={<LiverPredictionPage />} />
        <Route path="what-if" element={<WhatIfPage />} />
        <Route path="cross-risk" element={<CrossRiskPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="model-evaluation" element={<ModelEvaluationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
