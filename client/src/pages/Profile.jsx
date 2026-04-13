import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Key, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [userMsg, setUserMsg] = useState(null);
  
  // Admin only state
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER' });
  const [adminMsg, setAdminMsg] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/reset-password', { newPassword });
      setUserMsg({ type: 'success', text: 'Password reset successfully!' });
      setNewPassword('');
    } catch (err) {
      setUserMsg({ type: 'error', text: 'Failed to reset password.' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/users', newUser);
      setAdminMsg({ type: 'success', text: `User ${newUser.username} created!` });
      setNewUser({ username: '', password: '', role: 'USER' });
    } catch (err) {
      setAdminMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create user.' });
    }
  };

  return (
    <div className="profile-container">
      <div className="header">
        <h1>User Profile & Settings</h1>
        <p>Manage your account and system users.</p>
      </div>

      <div className="profile-grid">
        {/* Account Info & Password Reset */}
        <div className="glass-card section">
          <div className="section-header">
            <User size={24} color="#6366f1" />
            <h3>Your Account</h3>
          </div>
          
          <div className="user-info">
            <div className="info-row">
              <span className="label">Username</span>
              <span className="value">{user?.username}</span>
            </div>
            <div className="info-row">
              <span className="label">Role</span>
              <span className="value-badge">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="reset-form">
            <h4>Change Password</h4>
            <div className="input-with-icon">
              <Key size={18} className="icon" />
              <input 
                type="password" className="input-field" placeholder="New password" 
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-primary">Update Password</button>
            {userMsg && <div className={`msg ${userMsg.type}`}>{userMsg.text}</div>}
          </form>
        </div>

        {/* Admin Management */}
        {user?.role === 'ADMIN' && (
          <div className="glass-card section">
            <div className="section-header">
              <Shield size={24} color="#10b981" />
              <h3>User Management</h3>
            </div>
            
            <form onSubmit={handleCreateUser} className="create-user-form">
              <h4>Create New User</h4>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" className="input-field" placeholder="Username" 
                  value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Default Password</label>
                <input 
                  type="password" className="input-field" placeholder="Password" 
                  value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="input-field" 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn-primary green">
                <UserPlus size={18} /> Create User
              </button>
              {adminMsg && <div className={`msg ${adminMsg.type}`}>{adminMsg.text}</div>}
            </form>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-container { max-width: 1000px; margin: 0 auto; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
        .section { padding: 2rem; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
        .user-info { margin-bottom: 2.5rem; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--glass-border); }
        .value-badge { background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
        
        .reset-form, .create-user-form { display: flex; flex-direction: column; gap: 1.25rem; }
        h4 { font-family: var(--font-outfit); color: var(--text-secondary); margin-bottom: 0.5rem; }
        .btn-primary.green { background: linear-gradient(135deg, #10b981, #34d399); display: flex; align-items: center; justify-content: center; gap: 8px; }
        
        .msg { font-size: 0.875rem; padding: 10px; border-radius: 8px; }
        .msg.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
      `}} />
    </div>
  );
};

export default Profile;
