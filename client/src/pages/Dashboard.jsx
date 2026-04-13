import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, Layers, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Stats...</div>;

  const chartData = stats?.itemsByMake?.map(item => ({
    name: item.make || 'Unknown',
    count: item._sum.quantity
  })) || [];

  return (
    <div className="dashboard-grid">
      {/* Header Stats */}
      <section className="stat-cards">
        <div className="glass-card stat-card">
          <Package className="icon blue" size={24} />
          <div>
            <h3>Total Items</h3>
            <p className="value">{stats?.totalItems}</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <Layers className="icon green" size={24} />
          <div>
            <h3>Total Quantity</h3>
            <p className="value">{stats?.totalQuantity}</p>
          </div>
        </div>
        <div className="glass-card stat-card warning">
          <AlertTriangle className="icon orange" size={24} />
          <div>
            <h3>Low Stock Alerts</h3>
            <p className="value">{stats?.lowStockCount}</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <Activity className="icon purple" size={24} />
          <div>
            <h3>Makes Tracked</h3>
            <p className="value">{stats?.itemsByMake?.length}</p>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-view">
        <div className="glass-card chart-container">
          <h3>Inventory by Make</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card low-stock-list">
          <h3>Low Quantity Warning</h3>
          <div className="scroll-area">
            {stats?.lowStockItems?.length > 0 ? (
              stats.lowStockItems.map(item => (
                <div key={item.id} className="low-stock-item">
                  <div className="info">
                    <span className="name">{item.name}</span>
                    <span className="sku">{item.partNumber}</span>
                  </div>
                  <div className="qty-badge danger">
                    {item.quantity} / {item.minQuantity}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-msg">All stock levels healthy.</p>
            )}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-card .icon {
          padding: 12px;
          border-radius: 12px;
        }
        .stat-card .icon.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .stat-card .icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-card .icon.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-card .icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-card h3 { font-size: 0.875rem; color: var(--text-secondary); }
        .stat-card .value { font-size: 1.5rem; font-weight: 700; margin-top: 4px; }
        
        .charts-view {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        .chart-container, .low-stock-list {
          padding: 1.5rem;
        }
        .chart-container h3, .low-stock-list h3 {
          margin-bottom: 1.5rem;
          font-family: var(--font-outfit);
        }
        .low-stock-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .low-stock-item:last-child { border-bottom: none; }
        .info { display: flex; flex-direction: column; }
        .info .sku { font-size: 0.75rem; color: var(--text-secondary); }
        .qty-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .qty-badge.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .empty-msg { color: var(--text-secondary); text-align: center; margin-top: 2rem; }
        .scroll-area { max-height: 280px; overflow-y: auto; }
      `}} />
    </div>
  );
};

export default Dashboard;
