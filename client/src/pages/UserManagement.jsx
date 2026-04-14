import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Key, Shield, Trash2, CheckCircle2, AlertCircle, UserCog, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER' });
  const [editingUser, setEditingUser] = useState(null);
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

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/auth/users/${editingUser.id}`, editingUser);
      setMsg({ type: 'success', text: `User ${editingUser.username} updated!` });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed.' });
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (username === 'admin') return alert('The default admin cannot be deleted.');
    if (id === currentUser?.id) return alert('You cannot delete yourself.');
    
    if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;

    try {
      await axios.delete(`/api/auth/users/${id}`);
      setMsg({ type: 'success', text: `User ${username} deleted.` });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Delete failed.' });
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
          <h1>Account Management</h1>
        </div>
      </div>

      <div className="mgmt-grid">
        {/* Creation Section */}
        <section className="side-panel">
          <div className="glass-card panel-card">
            <div className="section-header">
              <UserPlus size={20} />
              <h3>Add New User</h3>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label>Username</label>
                <input 
                  type="text" value={newUser.username} placeholder="Username"
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Initial Password</label>
                <input 
                  type="password" value={newUser.password} placeholder="••••••••"
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Assigned Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn-save">Create Account</button>
            </form>
            <AnimatePresence>
              {msg && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`msg-box ${msg.type}`}>
                  {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {msg.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* List Section */}
        <section className="main-panel">
          <div className="glass-card user-table-card">
            <div className="table-header">
              <h3>Registered Users</h3>
              <span className="user-count">{users.length} Total</span>
            </div>
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-id">
                        <span className="username">{u.username}</span>
                        <span className="date">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill ${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="act-btn edit" onClick={() => setEditingUser(u)} title="Edit User">
                          <UserCog size={18} />
                        </button>
                        <button className="act-btn reset" onClick={() => handleResetPassword(u.id, u.username)} title="Reset Password">
                          <Key size={18} />
                        </button>
                        {u.username !== 'admin' && u.id !== currentUser.id && (
                          <button className="act-btn delete" onClick={() => handleDeleteUser(u.id, u.username)} title="Delete User">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-header">
                <h2>Edit Account</h2>
                <button onClick={() => setEditingUser(null)} className="btn-close"><X /></button>
              </div>
              <form onSubmit={handleUpdateUser} className="modal-form">
                <div className="input-group">
                  <label>Username</label>
                  <input 
                    type="text" value={editingUser.username} 
                    onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                    disabled={editingUser.username === 'admin'}
                  />
                </div>
                <div className="input-group">
                  <label>Role</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                    disabled={editingUser.id === currentUser.id}
                  >
                    <option value="USER">Standard User</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  {editingUser.id === currentUser.id && <p className="hint">You cannot change your own role.</p>}
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button type="submit" className="btn-save primary">Update User</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-mgmt-container { max-width: 1100px; margin: 0 auto; }
        .page-header { margin-bottom: 2rem; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .icon-green { color: #10b981; }

        .mgmt-grid { display: grid; grid-template-columns: 320px 1fr; gap: 2rem; }
        .panel-card { padding: 1.5rem; }
        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: #10b981; }
        
        .input-group { margin-bottom: 1.25rem; }
        .input-group label { display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px; }
        .input-group input, .input-group select { width: 100%; padding: 10px; border-radius: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; outline: none; }
        .input-group input:disabled { opacity: 0.5; cursor: not-allowed; }
        .hint { font-size: 0.75rem; color: #f59e0b; margin-top: 4px; }
        
        .btn-save { width: 100%; padding: 12px; border-radius: 10px; border: none; background: var(--primary); color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-save.primary { background: #10b981; }

        .user-table-card { padding: 1.5rem; }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .user-count { font-size: 0.8rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 10px; }
        
        .user-table { width: 100%; border-collapse: collapse; }
        .user-table th { text-align: left; padding: 1rem; border-bottom: 2px solid var(--glass-border); color: var(--text-secondary); font-size: 0.8rem; }
        .user-table td { padding: 1rem; border-bottom: 1px solid var(--glass-border); }
        
        .user-id { display: flex; flex-direction: column; gap: 4px; }
        .username { font-weight: 600; font-family: var(--font-outfit); }
        .date { font-size: 0.75rem; color: var(--text-secondary); }
        
        .role-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .role-pill.admin { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .role-pill.user { background: rgba(255,255,255,0.05); color: var(--text-secondary); }
        
        .action-row { display: flex; gap: 8px; }
        .act-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .act-btn:hover { background: rgba(255,255,255,0.05); }
        .act-btn.edit:hover { color: #10b981; }
        .act-btn.reset:hover { color: #f59e0b; }
        .act-btn.delete:hover { color: #ef4444; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-content { width: 100%; max-width: 400px; padding: 2rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .btn-close { background: none; border: none; color: white; cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .btn-cancel { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; }

        .msg-box { margin-top: 1rem; padding: 10px; border-radius: 8px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; }
        .msg-box.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg-box.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .error-view { text-align: center; padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
      `}} />
    </div>
  );
};

export default UserManagement;
