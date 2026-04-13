import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Package, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

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
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr><td colSpan="7" className="text-center">Loading inventory...</td></tr>
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
      `}} />
    </div>
  );
};

export default InventoryList;
