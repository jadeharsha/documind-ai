import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ChatPage } from './pages/ChatPage';
import { AgentPage } from './pages/AgentPage';
import { SummariesPage } from './pages/SummariesPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ResearchPage } from './pages/ResearchPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Authenticated SaaS App Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/summaries" element={<SummariesPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
