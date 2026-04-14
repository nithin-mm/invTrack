import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, User, Package, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/audit');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-container">
      <div className="page-header">
        <div className="title-group">
          <History size={28} className="icon-purple" />
          <h1>Activity Audit Logs</h1>
        </div>
        <div className="date-info">
          <Calendar size={16} />
          <span>Last 45 Days</span>
        </div>
      </div>

      <div className="glass-card table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Item</th>
              <th>SKU</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center">Loading audit history...</td></tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="timestamp">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div className="user-pill">
                      <User size={14} />
                      {log.user?.username || 'System'}
                    </div>
                  </td>
                  <td>
                    <span className={`action-pill ${log.type.toLowerCase()}`}>
                      {log.type === 'CHECK_IN' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      {log.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="font-medium">{log.itemName || log.item?.name || 'Deleted Item'}</td>
                  <td className="text-secondary">{log.itemPartNumber || log.item?.partNumber || '-'}</td>
                  <td className="qty-cell">
                    <span className={log.type === 'CHECK_IN' ? 'text-green' : log.type === 'CHECK_OUT' ? 'text-orange' : log.type === 'MANUAL_EDIT' ? 'text-blue' : 'text-red'}>
                      {log.type === 'CHECK_IN' ? '+' : log.type === 'CHECK_OUT' ? '-' : log.type === 'MANUAL_EDIT' ? '~' : 'X'}{log.quantity}
                    </span>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr><td colSpan="6" className="empty-state">No activity records found in the last 45 days.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .audit-container { max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .icon-purple { color: #8b5cf6; }
        
        .date-info { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 20px; }

        .table-wrapper { padding: 1rem; overflow-x: auto; }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th { text-align: left; padding: 1.25rem 1rem; border-bottom: 2px solid var(--glass-border); color: var(--text-secondary); font-size: 0.875rem; }
        .audit-table td { padding: 1.25rem 1rem; border-bottom: 1px solid var(--glass-border); font-size: 0.9rem; }
        
        .timestamp { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .user-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
        
        .action-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .action-pill.check_in { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .action-pill.check_out { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .qty-cell { font-weight: 700; font-size: 1.1rem; }
        .text-green { color: #10b981; }
        .text-orange { color: #f59e0b; }
        .empty-state { text-align: center; padding: 4rem; color: var(--text-secondary); font-style: italic; }
      `}} />
    </div>
  );
};

export default AuditLogs;
