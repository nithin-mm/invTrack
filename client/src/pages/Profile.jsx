import { useState } from 'react';
import axios from 'axios';
import { User, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [userMsg, setUserMsg] = useState(null);
  
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

  return (
    <div className="profile-container">
      <div className="header">
        <h1>Account Settings</h1>
        <p>Manage your password and view account details.</p>
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
            <h4>Change Your Password</h4>
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

        {/* Informational Panel */}
        <div className="glass-card info-panel">
          <div className="section-header">
            <Key size={24} color="#f59e0b" />
            <h3>Security Tips</h3>
          </div>
          <ul className="tips-list">
            <li>Use a strong, unique password for your account.</li>
            <li>Your role determines which parts of the inventory you can modify.</li>
            <li>Admins have full control over items and users.</li>
          </ul>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-container { max-width: 900px; margin: 0 auto; }
        .header { margin-bottom: 2rem; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .section, .info-panel { padding: 2rem; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
        .user-info { margin-bottom: 2.5rem; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--glass-border); }
        .value-badge { background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; }
        
        .reset-form { display: flex; flex-direction: column; gap: 1.25rem; }
        h4 { font-family: var(--font-outfit); color: var(--text-secondary); margin-bottom: 0.5rem; }
        
        .input-with-icon { position: relative; }
        .input-with-icon .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .input-field { width: 100%; padding: 12px 12px 12px 40px; border-radius: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; outline: none; }
        
        .tips-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; color: var(--text-secondary); font-size: 0.9rem; }
        .tips-list li { position: relative; padding-left: 20px; }
        .tips-list li::before { content: '•'; position: absolute; left: 0; color: #f59e0b; font-weight: bold; }

        .msg { font-size: 0.875rem; padding: 10px; border-radius: 8px; margin-top: 1rem; }
        .msg.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
      `}} />
    </div>
  );
};

export default Profile;
