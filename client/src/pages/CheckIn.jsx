import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, Package, CheckCircle2, ChevronRight, Barcode, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckIn = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    name: '', quantity: '', partNumber: '', make: '', model: '', minQuantity: '5', rackNumber: '', rackRowNumber: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const barcodeRef = useRef(null);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/check-in', formData);
      setMessage({ type: 'success', text: 'Item checked in successfully!' });
      setFormData({ name: '', quantity: '', partNumber: '', make: '', model: '', minQuantity: '5', rackNumber: '', rackRowNumber: '' });
      if (barcodeRef.current) barcodeRef.current.focus();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to check in' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await axios.post('/api/upload', data);
      setMessage({ type: 'success', text: `Successfully uploaded ${res.data.count} items!` });
      setFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed. Check file format.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-in-container">
      <div className="header">
        <h1>Inventory Check-In</h1>
        <p>Add items to your inventory manually or in bulk.</p>
      </div>

      <div className="tab-switcher">
        <button className={activeTab === 'manual' ? 'active' : ''} onClick={() => setActiveTab('manual')}>
          <Barcode size={18} /> Manual Entry
        </button>
        <button className={activeTab === 'bulk' ? 'active' : ''} onClick={() => setActiveTab('bulk')}>
          <FileSpreadsheet size={18} /> Bulk Upload
        </button>
      </div>

      <div className="glass-card form-container">
        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="manual-form">
            <div className="form-group full">
              <label>Part Number / Barcode</label>
              <div className="input-with-icon">
                <Barcode size={20} className="icon" />
                <input 
                  type="text" className="input-field" placeholder="Scan barcode..." 
                  value={formData.partNumber} onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
                  ref={barcodeRef} autoFocus required
                />
              </div>
            </div>
            
            <div className="form-group half">
              <label>Item Name</label>
              <input 
                type="text" className="input-field" placeholder="Item name" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="form-group half">
              <label>Quantity</label>
              <input 
                type="number" className="input-field" placeholder="0" 
                value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required 
              />
            </div>
            <div className="form-group half">
              <label>Make</label>
              <input type="text" className="input-field" placeholder="e.g. Dell" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} />
            </div>
            <div className="form-group half">
              <label>Model</label>
              <input type="text" className="input-field" placeholder="e.g. Latitude" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
            </div>

            <div className="form-group half">
              <label>Rack Number</label>
              <div className="input-with-icon">
                <MapPin size={18} className="icon" />
                <input type="text" className="input-field" placeholder="Rack-01" value={formData.rackNumber} onChange={(e) => setFormData({...formData, rackNumber: e.target.value})} />
              </div>
            </div>
            <div className="form-group half">
              <label>Rack Row Number</label>
              <div className="input-with-icon">
                <MapPin size={18} className="icon" />
                <input type="text" className="input-field" placeholder="Row-A" value={formData.rackRowNumber} onChange={(e) => setFormData({...formData, rackRowNumber: e.target.value})} />
              </div>
            </div>

            <div className="form-group full">
              <label>Min Quantity Warning</label>
              <input type="number" className="input-field" value={formData.minQuantity} onChange={(e) => setFormData({...formData, minQuantity: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Processing...' : 'Add to Inventory'}
            </button>
          </form>
        ) : (
          <div className="bulk-upload-zone">
            <FileSpreadsheet size={48} color="#6366f1" />
            <h3>Data Import</h3>
            <div className="file-input-wrapper">
              <input type="file" id="file" accept=".csv, .xlsx" onChange={(e) => setFile(e.target.files[0])} />
              <label htmlFor="file" className="file-label">
                <Upload size={20} /> {file ? file.name : 'Choose a file...'}
              </label>
            </div>
            {file && <button onClick={handleFileUpload} className="btn-primary" disabled={loading}>Confirm Upload</button>}
            <div className="template-info">
              <h4>Required Columns:</h4>
              <code>name, quantity, partNumber, make, model, rackNumber, rackRowNumber</code>
            </div>
          </div>
        )}
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`message-toast ${message.type}`}>
          {message.text}
        </motion.div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .check-in-container { max-width: 800px; margin: 0 auto; }
        .tab-switcher { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .tab-switcher button { flex: 1; padding: 12px; border-radius: 12px; border: none; background: rgba(255,255,255,0.05); color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .tab-switcher button.active { background: var(--primary); color: white; }
        .manual-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group.full { grid-column: span 2; }
        .input-with-icon { position: relative; }
        .input-with-icon .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .input-with-icon input { padding-left: 44px; }
        .message-toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 12px; background: rgba(16, 185, 129, 0.9); }
        .message-toast.error { background: rgba(239, 68, 68, 0.9); }
      `}} />
    </div>
  );
};

export default CheckIn;
