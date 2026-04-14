import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, MinusCircle, PackageSearch, Users, LogOut, User as UserIcon, List, History } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import InventoryList from './pages/InventoryList';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import Profile from './pages/Profile';

const API_BASE_URL = '/api';

// --- Axios Interceptor ---
axios.interceptors.request.use(config => {
  if (config.url && config.url.startsWith('/api') && API_BASE_URL !== '/api') {
    config.url = `${API_BASE_URL}${config.url}`;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (!initialized) return null;

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/" />;
  }

  return (
    <div className="app-container">
      {user && (
        <nav className="navbar glass-card">
          <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <PackageSearch size={32} color="#6366f1" />
            <span>InvTrack</span>
          </div>
          <div className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
              <List size={20} /> Stocks
            </Link>
            {user.role === 'ADMIN' && (
              <Link to="/check-in" className={location.pathname === '/check-in' ? 'active' : ''}>
                <PlusCircle size={20} /> Check-In
              </Link>
            )}
            <Link to="/check-out" className={location.pathname === '/check-out' ? 'active' : ''}>
              <MinusCircle size={20} /> Check-Out
            </Link>
            {user.role === 'ADMIN' && (
              <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                <Users size={20} /> Users
              </Link>
            )}
            <Link to="/audit" className={location.pathname === '/audit' ? 'active' : ''}>
              <History size={20} /> Audit
            </Link>
          </div>
          <div className="nav-user">
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              <UserIcon size={20} /> <span>{user.username}</span>
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} />
            </button>
          </div>
        </nav>
      )}

      <main className="content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login onLogin={setUser} apiUrl={API_BASE_URL} />} />
            <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/inventory" element={<PageWrapper><InventoryList /></PageWrapper>} />
            <Route path="/check-in" element={<PageWrapper><CheckIn /></PageWrapper>} />
            <Route path="/check-out" element={<PageWrapper><CheckOut /></PageWrapper>} />
            {user?.role === 'ADMIN' && (
              <Route path="/users" element={<PageWrapper><UserManagement currentUser={user} /></PageWrapper>} />
            )}
            <Route path="/audit" element={<PageWrapper><AuditLogs /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile user={user} /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          margin-bottom: 2rem;
          position: sticky;
          top: 1rem;
          z-index: 100;
        }
        .logo { display: flex; align-items: center; gap: 8px; font-family: var(--font-outfit); font-size: 1.25rem; font-weight: 800; }
        .nav-links { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .nav-links a {
          display: flex; align-items: center; gap: 6px; text-decoration: none;
          color: var(--text-secondary); font-weight: 500; transition: all 0.3s;
          padding: 8px 12px; border-radius: 10px; font-size: 0.9rem;
        }
        .nav-links a:hover { color: var(--text-primary); background: rgba(255, 255, 255, 0.05); }
        .nav-links a.active { color: var(--primary); background: rgba(99, 102, 241, 0.1); }
        
        .nav-user { display: flex; align-items: center; gap: 0.75rem; border-left: 1px solid var(--glass-border); padding-left: 1rem; }
        .nav-user a { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; }
        .btn-logout { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; }
        .btn-logout:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .content { flex: 1; }
      `}} />
    </div>
  );
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export default App;
