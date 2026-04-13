import { useState } from 'react';
import axios from 'axios';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ onLogin, apiUrl }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Small check to see if server is even reachable
      await axios.get(`${apiUrl}/api/health`, { timeout: 2000 });
      
      const res = await axios.post(`${apiUrl}/api/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      if (!err.response) {
        setError(`Unable to reach the server at ${apiUrl}. Please check your docker-compose logs and ensure port 4000 is open.`);
      } else {
        setError(err.response?.data?.error || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card login-card"
      >
        <div className="login-header">
          <div className="logo-icon">
            <LogIn size={32} />
          </div>
          <h1>InvTrack Login</h1>
          <p>Please enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <User size={18} className="icon" />
              <input 
                type="text" 
                className="input-field" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="icon" />
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>
          </div>

          {error && (
            <div className="error-msg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
        }
        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .logo-icon {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary);
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .login-header h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .login-header p {
          color: var(--text-secondary);
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .input-with-icon {
          position: relative;
        }
        .input-with-icon .icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }
        .input-with-icon input {
          padding-left: 44px;
        }
        .login-btn {
          width: 100%;
          margin-top: 1rem;
        }
        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
      `}} />
    </div>
  );
};

export default Login;
