import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Package, Search, Filter, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Auth & Admin State
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const isAdmin = user.role === 'ADMIN';

  // Interaction State
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [page]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/inventory?page=${page}&limit=20`);
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.put(`/api/inventory/${editingItem.id}`, editingItem);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await axios.delete(`/api/inventory/${deletingId}`);
      setDeletingId(null);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.partNumber && item.partNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="inventory-list-container">
      <div className="page-header">
        <div className="title-group">
          <Package size={28} className="icon-blue" />
          <h1>Stock Inventory</h1>
        </div>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>SKU / Part No</th>
              <th>Make</th>
              <th>Model</th>
              <th>Location (Rack-Row)</th>
              <th>Quantity</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center">Loading inventory...</td></tr>
              ) : filteredItems.map((item) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <td className="font-medium">{item.name}</td>
                  <td className="text-secondary">{item.partNumber || '-'}</td>
                  <td>{item.make || '-'}</td>
                  <td>{item.model || '-'}</td>
                  <td>
                    <span className="location-tag">
                      {item.rackNumber || '?'}-{item.rackRowNumber || '?'}
                    </span>
                  </td>
                  <td className="font-bold">{item.quantity}</td>
                  <td>
                    <span className={`status-pill ${item.quantity <= item.minQuantity ? 'low' : 'healthy'}`}>
                      {item.quantity <= item.minQuantity ? 'Low Stock' : 'Healthy'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => setEditingItem(item)}>
                          <Edit3 size={18} />
                        </button>
                        <button className="icon-btn delete" onClick={() => setDeletingId(item.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <button 
            className="p-btn" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="page-info">
            Page <span>{page}</span> of {totalPages}
          </div>
          <button 
            className="p-btn" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-header">
                <h2>Edit Item</h2>
                <button onClick={() => setEditingItem(null)} className="btn-close"><X /></button>
              </div>
              <form onSubmit={handleUpdate} className="edit-form">
                <div className="form-group">
                  <label>Item Name</label>
                  <input className="input-field" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                </div>
                <div className="form-row">
                   <div className="form-group">
                     <label>SKU / Part Number</label>
                     <input className="input-field" value={editingItem.partNumber} onChange={e => setEditingItem({...editingItem, partNumber: e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label>Quantity</label>
                     <input className="input-field" type="number" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} required />
                   </div>
                </div>
                <div className="form-row">
                   <div className="form-group">
                     <label>Make</label>
                     <input className="input-field" value={editingItem.make} onChange={e => setEditingItem({...editingItem, make: e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label>Model</label>
                     <input className="input-field" value={editingItem.model} onChange={e => setEditingItem({...editingItem, model: e.target.value})} />
                   </div>
                </div>
                <div className="form-row">
                   <div className="form-group">
                     <label>Rack</label>
                     <input className="input-field" value={editingItem.rackNumber} onChange={e => setEditingItem({...editingItem, rackNumber: e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label>Row</label>
                     <input className="input-field" value={editingItem.rackRowNumber} onChange={e => setEditingItem({...editingItem, rackRowNumber: e.target.value})} />
                   </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="p-btn" onClick={() => setEditingItem(null)}>Cancel</button>
                  <button type="submit" className="p-btn primary" disabled={submitLoading}>
                    {submitLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingId && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card modal-content sm" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="delete-alert">
                <AlertTriangle size={48} className="text-red" />
                <h3>Delete Item?</h3>
                <p>This will permanently remove the item. However, the existing audit logs for this item will be preserved.</p>
                <div className="modal-actions">
                  <button className="p-btn" onClick={() => setDeletingId(null)}>Cancel</button>
                  <button className="p-btn delete-confirm" onClick={handleDelete} disabled={submitLoading}>
                    {submitLoading ? 'Deleting...' : 'Yes, Delete Item'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .inventory-list-container { max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .icon-blue { color: #6366f1; }
        
        .search-bar { position: relative; width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .search-bar input { width: 100%; padding: 10px 10px 10px 40px; border-radius: 12px; background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none; transition: all 0.2s; }
        .search-bar input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }

        .table-wrapper { padding: 1rem; overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
        .modern-table th { padding: 1.25rem 1rem; border-bottom: 2px solid var(--glass-border); color: var(--text-secondary); font-size: 0.875rem; font-weight: 600; }
        .modern-table td { padding: 1.25rem 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.95rem; }
        
        .location-tag { background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.875rem; }
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .status-pill.healthy { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .pagination { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 0; border-top: 1px solid var(--glass-border); }
        .p-btn { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .p-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .p-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .page-info { font-size: 0.875rem; color: var(--text-secondary); }
        .page-info span { color: var(--text-primary); font-weight: 600; }

        .action-btns { display: flex; gap: 8px; }
        .icon-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
        .icon-btn:hover { background: rgba(255,255,255,0.05); }
        .icon-btn.edit:hover { color: var(--primary); }
        .icon-btn.delete:hover { color: #ef4444; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-content { width: 100%; max-width: 500px; padding: 2rem; border: 1px solid var(--glass-border); }
        .modal-content.sm { max-width: 400px; text-align: center; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .btn-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
        
        .edit-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.8rem; color: var(--text-secondary); }
        .input-field { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; padding: 10px; border-radius: 8px; outline: none; }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        .p-btn.primary { background: var(--primary); border: none; font-weight: 600; }
        .delete-alert { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .text-red { color: #ef4444; }
        .delete-confirm { background: #ef4444; border: none; font-weight: 600; }
      `}} />
    </div>
  );
};

export default InventoryList;
