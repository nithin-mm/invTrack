import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Key, Shield, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/users', newUser);
      setMsg({ type: 'success', text: `User ${newUser.username} created!` });
      setNewUser({ username: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create user.' });
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPass = prompt(`Enter new password for ${username}:`);
    if (!newPass) return;
    
    try {
      await axios.post(`/api/auth/users/${userId}/reset-password`, { newPassword: newPass });
      setMsg({ type: 'success', text: `Password reset for ${username}!` });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to reset password.' });
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="error-view glass-card">
        <Shield size={48} color="#ef4444" />
        <h2>Access Denied</h2>
        <p>Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="user-mgmt-container">
      <div className="page-header">
        <div className="title-group">
          <Users size={28} className="icon-green" />
          <h1>User Management</h1>
        </div>
      </div>

      <div className="mgmt-grid">
        {/* User Statistics & Creation */}
        <section className="side-panel">
          <div className="glass-card creation-card">
            <div className="section-header">
              <UserPlus size={20} />
              <h3>Add New User</h3>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label>Username</label>
                <input 
                  type="text" value={newUser.username} placeholder="nithin"
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" value={newUser.password} placeholder="••••••••"
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>System Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Create Account</button>
            </form>
            <AnimatePresence>
              {msg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`msg-box ${msg.type}`}
                >
                  {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {msg.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* User List */}
        <section className="main-panel">
          <div className="glass-card user-table-card">
            <h3>Registered Users</h3>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.username}</td>
                    <td>
                      <span className={`role-badge ${u.role === 'ADMIN' ? 'admin' : 'user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-secondary">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        className="reset-btn"
                        onClick={() => handleResetPassword(u.id, u.username)}
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-mgmt-container { max-width: 1100px; margin: 0 auto; }
        .page-header { margin-bottom: 2rem; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .icon-green { color: #10b981; }

        .mgmt-grid { display: grid; grid-template-columns: 320px 1fr; gap: 2rem; }
        .creation-card { padding: 1.5rem; }
        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: var(--primary); }
        
        .input-group { margin-bottom: 1.25rem; }
        .input-group label { display: block; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 6px; }
        .input-group input, .input-group select { width: 100%; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-primary); }
        
        .msg-box { margin-top: 1rem; padding: 10px; border-radius: 8px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }
        .msg-box.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg-box.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .user-table-card { padding: 1.5rem; }
        .user-table-card h3 { margin-bottom: 1.5rem; font-family: var(--font-outfit); }
        .user-table { width: 100%; border-collapse: collapse; }
        .user-table th { text-align: left; padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-secondary); font-size: 0.875rem; }
        .user-table td { padding: 1rem; border-bottom: 1px solid var(--glass-border); }
        
        .role-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .role-badge.admin { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .role-badge.user { background: rgba(255,255,255,0.05); color: var(--text-secondary); }
        
        .reset-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
        .reset-btn:hover { color: var(--primary); }

        .error-view { text-align: center; padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
      `}} />
    </div>
  );
};

export default UserManagement;
