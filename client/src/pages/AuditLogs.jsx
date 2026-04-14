import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, User, Calendar, ArrowUpRight, ArrowDownLeft, UserPlus, UserCog, UserMinus, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/audit?page=${page}&limit=100&search=${search}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page on new search
  };

  return (
    <div className="audit-container">
      <div className="page-header">
        <div className="title-group">
          <History size={28} className="icon-purple" />
          <h1>Activity Audit Logs</h1>
        </div>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search items, users, notes..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn-search">Search</button>
          </form>
          <div className="date-info">
            <Calendar size={16} />
            <span>Last 180 Days</span>
          </div>
        </div>
      </div>

      <div className="glass-card table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Item / Description</th>
              <th>SKU</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr><td colSpan="6" className="text-center">Loading audit history...</td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="timestamp">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="user-pill">
                        <User size={14} />
                        {log.username || log.user?.username || 'System'}
                      </div>
                    </td>
                    <td>
                      <span className={`action-pill ${log.type.toLowerCase()}`}>
                        {log.type === 'CHECK_IN' && <ArrowDownLeft size={14} />}
                        {log.type === 'CHECK_OUT' && <ArrowUpRight size={14} />}
                        {log.type === 'USER_CREATE' && <UserPlus size={14} />}
                        {log.type === 'USER_UPDATE' && <UserCog size={14} />}
                        {log.type === 'USER_DELETE' && <UserMinus size={14} />}
                        {log.type === 'USER_PWD_RESET' && <ShieldAlert size={14} />}
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="item-cell">
                        <span className="font-medium">{log.itemName || log.item?.name || '---'}</span>
                        {log.note && <span className="note-text">{log.note}</span>}
                      </div>
                    </td>
                    <td className="text-secondary">{log.itemPartNumber || log.item?.partNumber || '-'}</td>
                    <td className="qty-cell">
                      <span className={['CHECK_IN', 'USER_CREATE'].includes(log.type) ? 'text-green' : ['CHECK_OUT', 'USER_PWD_RESET'].includes(log.type) ? 'text-orange' : ['MANUAL_EDIT', 'USER_UPDATE'].includes(log.type) ? 'text-blue' : 'text-red'}>
                        {log.type === 'CHECK_IN' ? '+' : log.type === 'CHECK_OUT' ? '-' : log.type === 'MANUAL_EDIT' ? '~' : log.type === 'USER_CREATE' ? 'NEW' : log.type === 'USER_DELETE' ? 'DEL' : '•'}{log.quantity !== 0 ? Math.abs(log.quantity) : ''}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan="6" className="empty-state">No matching records found in the last 180 days.</td></tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
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
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .audit-container { max-width: 1250px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .icon-purple { color: #8b5cf6; }
        
        .header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; }
        
        .search-box { position: relative; display: flex; gap: 8px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .search-box input { min-width: 250px; padding: 10px 10px 10px 40px; border-radius: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); color: white; outline: none; }
        .btn-search { background: var(--primary); border: none; color: white; padding: 0 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        
        .date-info { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; }

        .table-wrapper { padding: 1rem; overflow-x: auto; }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th { text-align: left; padding: 1.25rem 1rem; border-bottom: 2px solid var(--glass-border); color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .audit-table td { padding: 1.25rem 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.875rem; }
        
        .timestamp { color: var(--text-secondary); font-size: 0.8rem; }
        .user-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
        
        .action-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .action-pill.check_in { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .action-pill.check_out { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .action-pill.manual_edit { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .action-pill.manual_delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .action-pill.user_create { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .action-pill.user_update { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .action-pill.user_delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .action-pill.user_pwd_reset { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .item-cell { display: flex; flex-direction: column; gap: 4px; }
        .note-text { font-size: 0.75rem; color: var(--text-secondary); font-style: italic; }

        .qty-cell { font-weight: 700; font-size: 1rem; }
        .text-green { color: #10b981; }
        .text-orange { color: #f59e0b; }
        .text-blue { color: #6366f1; }
        .text-red { color: #ef4444; }
        .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); font-style: italic; }

        .pagination { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 0; }
        .p-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .p-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
        .p-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .page-info { font-size: 0.8rem; color: var(--text-secondary); }
        .page-info span { color: white; font-weight: 600; }
      `}} />
    </div>
  );
};

export default AuditLogs;
