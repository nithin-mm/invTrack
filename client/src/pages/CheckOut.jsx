import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MinusCircle, Package, AlertCircle, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckOut = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({}); // { partNumber: quantity }
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      // Fetch a larger set for searching in the checkout view
      const res = await axios.get('/api/inventory?limit=100');
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.partNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (partNumber) => {
    setCart(prev => ({
      ...prev,
      [partNumber]: (prev[partNumber] || 0) + 1
    }));
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      for (const [partNumber, qty] of Object.entries(cart)) {
        await axios.post('/api/check-out', { partNumber, quantity: qty });
      }
      setMessage({ type: 'success', text: 'Checked out items successfully!' });
      setCart({});
      fetchItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Check-out failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="header">
        <h1>Inventory Check-Out</h1>
        <p>Select items to remove from the system.</p>
      </div>

      <div className="checkout-layout">
        <div className="search-section">
          <div className="glass-card search-bar">
            <Search size={20} className="icon" />
            <input 
              type="text" 
              placeholder="Search by name or part number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="items-list">
            <AnimatePresence>
              {filteredItems.map(item => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card item-row"
                >
                  <div className="item-info">
                    <Package className="icon" size={20} />
                    <div className="details">
                      <span className="name">{item.name}</span>
                      <span className="sku">{item.partNumber}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <span className="stock">In Stock: <strong>{item.quantity}</strong></span>
                    <button 
                      className="btn-add" 
                      onClick={() => addToCart(item.partNumber)}
                      disabled={item.quantity === 0 || (cart[item.partNumber] || 0) >= item.quantity}
                    >
                      Check Out
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="cart-section">
          <div className="glass-card cart-container">
            <h3>Check-Out Queue</h3>
            <div className="cart-items">
              {Object.keys(cart).length === 0 ? (
                <div className="empty-cart">
                  <ShoppingCart size={48} />
                  <p>Queue is empty</p>
                </div>
              ) : (
                Object.entries(cart).map(([partNumber, qty]) => {
                  const item = items.find(i => i.partNumber === partNumber);
                  return (
                    <div key={partNumber} className="cart-item">
                      <span>{item?.name}</span>
                      <div className="qty-controls">
                        <button onClick={() => setCart({...cart, [partNumber]: Math.max(0, qty - 1)})}>-</button>
                        <span>{qty}</span>
                        <button onClick={() => addToCart(partNumber)} disabled={qty >= (item?.quantity || 0)}>+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {Object.keys(cart).length > 0 && (
              <button className="btn-primary checkout-btn" onClick={handleCheckOut} disabled={loading}>
                {loading ? 'Processing...' : 'Complete Check-Out'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .checkout-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        .search-bar { padding: 0.5rem 1rem; display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
        .search-bar .icon { color: var(--text-secondary); }
        .search-bar input { background: transparent; border: none; padding: 10px; width: 100%; color: white; }
        .items-list { display: flex; flex-direction: column; gap: 1rem; max-height: 60vh; overflow-y: auto; padding-right: 10px; }
        .item-row { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; }
        .item-info { display: flex; align-items: center; gap: 1rem; }
        .item-info .icon { color: var(--primary); background: rgba(99, 102, 241, 0.1); padding: 8px; border-radius: 8px; }
        .details { display: flex; flex-direction: column; }
        .details .name { font-weight: 600; }
        .details .sku { font-size: 0.75rem; color: var(--text-secondary); }
        .item-actions { display: flex; align-items: center; gap: 1.5rem; }
        .stock { font-size: 0.875rem; color: var(--text-secondary); }
        .btn-add { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
        .btn-add:disabled { background: rgba(255,255,255,0.05); color: var(--text-secondary); cursor: not-allowed; }
        
        .cart-container { padding: 1.5rem; position: sticky; top: 1rem; min-height: 300px; display: flex; flex-direction: column; }
        .cart-items { flex: 1; margin: 1.5rem 0; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .qty-controls { display: flex; align-items: center; gap: 10px; }
        .qty-controls button { background: rgba(255,255,255,0.1); border: none; color: white; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; }
        .empty-cart { text-align: center; color: var(--text-secondary); margin-top: 3rem; }
        .checkout-btn { width: 100%; margin-top: 1rem; }
      `}} />
    </div>
  );
};

export default CheckOut;
