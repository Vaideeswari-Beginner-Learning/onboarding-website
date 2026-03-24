import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import CandidateDashboard from './pages/candidate/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PersonalDetails from './pages/candidate/PersonalDetails';
import BankDetails from './pages/candidate/BankDetails';
import DocumentUpload from './pages/candidate/DocumentUpload';
import AdminDashboard from './pages/admin/AdminDashboard';
import CandidateDetail from './pages/admin/CandidateDetail';
import AddCandidate from './pages/admin/AddCandidate';

import OnboardingComplete from './pages/candidate/OnboardingComplete';
import ChatSupport from './components/ChatSupport';
import AdminChat from './pages/admin/AdminChat';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CandidateDashboard />
              </ProtectedRoute>
            } />

            <Route path="/onboarding/personal-details" element={
              <ProtectedRoute>
                <PersonalDetails />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/bank-details" element={
              <ProtectedRoute>
                <BankDetails />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/documents" element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/candidate/:id" element={
              <ProtectedRoute adminOnly>
                <CandidateDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/add-candidate" element={
              <ProtectedRoute adminOnly>
                <AddCandidate />
              </ProtectedRoute>
            } />

            <Route path="/admin/chat" element={
              <ProtectedRoute adminOnly>
                <AdminChat />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <ChatSupport />
      </Router>
    </AuthProvider>
  );
}

export default App;
