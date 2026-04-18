import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings2, Plus, Trash2, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ColumnSettings = () => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCol, setNewCol] = useState({ name: '', visibility: 'ALL' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      const res = await axios.get('/api/custom-columns');
      setColumns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newCol.name.trim()) return;
    try {
      await axios.post('/api/custom-columns', newCol);
      setMsg({ type: 'success', text: `Column "${newCol.name}" added!` });
      setNewCol({ name: '', visibility: 'ALL' });
      fetchColumns();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add column.' });
    }
  };

  const toggleVisibility = async (col) => {
    const nextVis = col.visibility === 'ALL' ? 'ADMIN' : 'ALL';
    try {
      await axios.put(`/api/custom-columns/${col.id}`, { visibility: nextVis });
      fetchColumns();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update visibility.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" column? Existing data in this column will not be visible.`)) return;
    try {
      await axios.delete(`/api/custom-columns/${id}`);
      fetchColumns();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete column.' });
    }
  };

  return (
    <div className="column-settings-container">
      <div className="page-header">
        <div className="title-group">
          <Settings2 size={28} className="icon-indigo" />
          <h1>Stock Column Settings</h1>
        </div>
        <p className="subtitle">Add or manage custom data fields for your inventory items.</p>
      </div>

      <div className="settings-grid">
        <div className="glass-card add-col-card">
          <div className="card-header">
            <Plus size={20} />
            <h3>Create New Column</h3>
          </div>
          <form onSubmit={handleAddColumn}>
            <div className="form-group">
              <label>Field Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Serial Number"
                value={newCol.name}
                onChange={e => setNewCol({...newCol, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Initial Visibility</label>
              <select 
                className="input-field"
                value={newCol.visibility}
                onChange={e => setNewCol({...newCol, visibility: e.target.value})}
              >
                <option value="ALL">Everyone</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>
            <button type="submit" className="btn-primary full-width">Add Column</button>
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

        <div className="glass-card list-col-card">
          <div className="card-header">
            <h3>Active Columns</h3>
            <span className="count-tag">{columns.length}</span>
          </div>
          <div className="columns-list">
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : columns.length === 0 ? (
              <div className="empty-state">
                <p>No custom columns defined yet.</p>
              </div>
            ) : (
              columns.map(col => (
                <div key={col.id} className="col-item">
                  <div className="col-info">
                    <span className="col-name">{col.name}</span>
                    <span className={`vis-pill ${col.visibility.toLowerCase()}`}>
                      {col.visibility === 'ALL' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {col.visibility === 'ALL' ? 'Public' : 'Admin'}
                    </span>
                  </div>
                  <div className="col-actions">
                    <button className="icon-btn" onClick={() => toggleVisibility(col)} title="Toggle Visibility">
                      <Shield size={18} />
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDelete(col.id, col.name)} title="Delete Column">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .column-settings-container { max-width: 900px; margin: 0 auto; }
        .page-header { margin-bottom: 2.5rem; }
        .title-group { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .icon-indigo { color: #6366f1; }
        .subtitle { color: var(--text-secondary); font-size: 0.95rem; }

        .settings-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
        .add-col-card, .list-col-card { padding: 2rem; }
        
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; color: #6366f1; }
        .card-header h3 { font-size: 1.1rem; color: var(--text-primary); }
        .count-tag { background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; color: var(--text-secondary); }

        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px; }
        .input-field { width: 100%; padding: 10px; border-radius: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; outline: none; }
        
        .btn-primary.full-width { width: 100%; margin-top: 0.5rem; }
        
        .columns-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .col-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; transition: all 0.2s; }
        .col-item:hover { border-color: rgba(99, 102, 241, 0.4); }
        
        .col-info { display: flex; align-items: center; gap: 1rem; }
        .col-name { font-weight: 600; font-family: var(--font-outfit); }
        
        .vis-pill { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .vis-pill.all { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .vis-pill.admin { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .col-actions { display: flex; gap: 8px; }
        .icon-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(255,255,255,0.05); color: #6366f1; }
        .icon-btn.delete:hover { color: #ef4444; }

        .msg-box { margin-top: 1rem; padding: 10px; border-radius: 8px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; }
        .msg-box.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg-box.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        .loading-text { color: var(--text-secondary); text-align: center; padding: 2rem; }
        .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); font-size: 0.9rem; border: 1px dashed var(--glass-border); border-radius: 12px; }
      `}} />
    </div>
  );
};

export default ColumnSettings;
