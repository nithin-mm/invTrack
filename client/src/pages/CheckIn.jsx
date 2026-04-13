import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusCircle, FileSpreadsheet, Barcode, Upload, 
  CheckCircle2, AlertCircle, ChevronRight, ArrowLeft,
  Settings2, Table as TableIcon, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const STEPS = {
  TYPE: 'TYPE',
  MANUAL: 'MANUAL',
  UPLOAD: 'UPLOAD',
  MAPPING: 'MAPPING',
  PREVIEW: 'PREVIEW'
};

const REQUIRED_FIELDS = ['name', 'quantity'];
const OPTIONAL_FIELDS = ['partNumber', 'make', 'model', 'rackNumber', 'rackRowNumber', 'minQuantity', 'description'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const CheckIn = () => {
  const [step, setStep] = useState(STEPS.TYPE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Manual State
  const [formData, setFormData] = useState({
    name: '', quantity: '', partNumber: '', make: '', 
    model: '', minQuantity: '5', rackNumber: '', rackRowNumber: '',
    description: ''
  });
  const barcodeRef = useRef(null);

  // Bulk State
  const [fileData, setFileData] = useState(null); // Raw rows from file
  const [headers, setHeaders] = useState([]);    // File headers
  const [mapping, setMapping] = useState({});    // { field: headerIndex }
  const [mappedData, setMappedData] = useState([]); // Array of objects ready for import
  const [errors, setErrors] = useState([]);

  // --- Manual Logic ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/check-in', formData);
      setMessage({ type: 'success', text: 'Item checked in successfully!' });
      setFormData({ name: '', quantity: '', partNumber: '', make: '', model: '', minQuantity: '5', rackNumber: '', rackRowNumber: '', description: '' });
      if (barcodeRef.current) barcodeRef.current.focus();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to check in' });
    } finally {
      setLoading(false);
    }
  };

  // --- Bulk Step 2: File Upload & Parse ---
  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => processFileData(results.data),
        header: false,
        skipEmptyLines: true
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processFileData(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const processFileData = (rows) => {
    if (rows.length < 2) {
      setMessage({ type: 'error', text: 'File is empty or has no data rows.' });
      return;
    }
    const fileHeaders = rows[0];
    setHeaders(fileHeaders);
    setFileData(rows.slice(1));
    
    // Auto-mapping logic
    const initialMapping = {};
    ALL_FIELDS.forEach(field => {
      const index = fileHeaders.findIndex(h => 
        h?.toLowerCase().includes(field.toLowerCase()) ||
        (field === 'partNumber' && h?.toLowerCase().includes('sku'))
      );
      if (index !== -1) initialMapping[field] = index;
    });
    setMapping(initialMapping);
    setStep(STEPS.MAPPING);
  };

  // --- Bulk Step 3: Validation & Preview ---
  useEffect(() => {
    if (step === STEPS.PREVIEW) {
      const mapped = fileData.map((row, index) => {
        const obj = {};
        ALL_FIELDS.forEach(field => {
          const colIdx = mapping[field];
          obj[field] = colIdx !== undefined ? row[colIdx] : '';
        });
        obj._rowId = index;
        return obj;
      });

      const errs = [];
      mapped.forEach((item, idx) => {
        if (!item.name) errs.push(`Row ${idx + 1}: Missing Name`);
        if (!item.quantity || isNaN(parseInt(item.quantity))) errs.push(`Row ${idx + 1}: Invalid Quantity`);
      });

      setMappedData(mapped);
      setErrors(errs);
    }
  }, [step, fileData, mapping]);

  const handleFinalImport = async () => {
    if (errors.length > 0) return;
    setLoading(true);
    try {
      await axios.post('/api/check-in/bulk', { items: mappedData });
      setMessage({ type: 'success', text: `Successfully imported ${mappedData.length} items!` });
      setTimeout(() => setStep(STEPS.TYPE), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Bulk import failed.' });
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  return (
    <div className="checkin-container">
      <div className="page-header">
        <h1>Inventory Check-In</h1>
        <p>Add single items manually or bulk upload from Excel/CSV.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === STEPS.TYPE && (
          <motion.div 
            key="type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="entry-options"
          >
            <button className="glass-card option-card" onClick={() => setStep(STEPS.MANUAL)}>
              <div className="icon-wrapper orange">
                <Barcode size={32} />
              </div>
              <h3>Manual Entry</h3>
              <p>Scan barcode or enter details for a single item.</p>
            </button>
            <button className="glass-card option-card" onClick={() => setStep(STEPS.UPLOAD)}>
              <div className="icon-wrapper blue">
                <FileSpreadsheet size={32} />
              </div>
              <h3>Bulk Upload</h3>
              <p>Map and import data from Excel or CSV files.</p>
            </button>
          </motion.div>
        )}

        {step === STEPS.MANUAL && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="entry-view">
            <button className="btn-back" onClick={() => setStep(STEPS.TYPE)}>
              <ArrowLeft size={16} /> Back to Options
            </button>
            <form className="glass-card manual-form" onSubmit={handleManualSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name <small className="req">*</small></label>
                  <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Part Number / Barcode</label>
                  <input type="text" className="input-field" ref={barcodeRef} value={formData.partNumber} onChange={e => setFormData({...formData, partNumber: e.target.value})} placeholder="Scan or type..." />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity <small className="req">*</small></label>
                  <input type="number" className="input-field" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Min. Warning Level</label>
                  <input type="number" className="input-field" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Make</label>
                  <input type="text" className="input-field" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} placeholder="e.g., Apple" />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input type="text" className="input-field" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g., M2 Pro" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rack Number</label>
                  <input type="text" className="input-field" value={formData.rackNumber} onChange={e => setFormData({...formData, rackNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Rack Row</label>
                  <input type="text" className="input-field" value={formData.rackRowNumber} onChange={e => setFormData({...formData, rackRowNumber: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea className="input-field textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Complete Check-In'}
              </button>

              {message && (
                <div className={`msg-box ${message.type}`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
            </form>
          </motion.div>
        )}

        {step === STEPS.UPLOAD && (
          <motion.div key="upload" className="entry-view glass-card upload-step">
            <button className="btn-back" onClick={() => setStep(STEPS.TYPE)}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="upload-area">
              <Upload size={64} className="icon-blue" />
              <h2>Upload Data File</h2>
              <p>Select your Excel (.xlsx) or CSV file to begin mapping.</p>
              <input type="file" id="file" hidden accept=".csv, .xlsx, .xls" onChange={handleFileLoad} />
              <label htmlFor="file" className="btn-primary btn-upload">Choose File</label>
            </div>
          </motion.div>
        )}

        {step === STEPS.MAPPING && (
          <motion.div key="mapping" className="entry-view mapping-view">
             <div className="glass-card mapping-card">
               <div className="section-header">
                 <Settings2 size={24} />
                 <h2>Step 1: Map your columns</h2>
                 <p>Link your file headers to InvTrack fields.</p>
               </div>
               <div className="mapping-grid">
                 {ALL_FIELDS.map(field => (
                   <div key={field} className="mapping-item">
                     <div className="field-info">
                       <span className="field-name">{field.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                       {REQUIRED_FIELDS.includes(field) && <small className="req-label">REQUIRED</small>}
                     </div>
                     <select 
                       value={mapping[field] ?? ''} 
                       onChange={(e) => setMapping({...mapping, [field]: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                     >
                       <option value="">-- Ignore --</option>
                       {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i+1}`}</option>)}
                     </select>
                   </div>
                 ))}
               </div>
               <div className="actions">
                 <button className="btn-secondary" onClick={() => setStep(STEPS.UPLOAD)}>Cancel</button>
                 <button className="btn-primary" onClick={() => setStep(STEPS.PREVIEW)}>Next: Review Data</button>
               </div>
             </div>
          </motion.div>
        )}

        {step === STEPS.PREVIEW && (
          <motion.div key="preview" className="entry-view preview-view">
            <div className="glass-card preview-card">
               <div className="section-header">
                 <TableIcon size={24} />
                 <h2>Step 2: Review & Validate</h2>
                 <p>Check for errors before confirming the import.</p>
               </div>
               
               {errors.length > 0 && (
                 <div className="error-list glass-card">
                   <div className="sticky-error-header">
                     <AlertCircle size={20} />
                     <h3>Please fix the following {errors.length} errors:</h3>
                   </div>
                   <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                 </div>
               )}

               <div className="preview-table-wrapper">
                 <table className="modern-table slim">
                   <thead>
                     <tr>
                       {REQUIRED_FIELDS.map(f => <th key={f}>{f.toUpperCase()} *</th>)}
                       {OPTIONAL_FIELDS.slice(0, 3).map(f => <th key={f}>{f.toUpperCase()}</th>)}
                     </tr>
                   </thead>
                   <tbody>
                     {mappedData.map((row, i) => {
                       const hasError = !row.name || !row.quantity || isNaN(row.quantity);
                       return (
                        <tr key={i} className={hasError ? 'row-error' : ''}>
                          <td>{row.name || <span className="missing">MISSING</span>}</td>
                          <td>{row.quantity || <span className="missing">MISSING</span>}</td>
                          <td>{row.partNumber}</td>
                          <td>{row.make}</td>
                          <td>{row.model}</td>
                        </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>

               <div className="actions footer-actions">
                 <div className="stats-info">
                   Total Items: <strong>{mappedData.length}</strong> | 
                   Errors Found: <strong className={errors.length > 0 ? 'text-red' : ''}>{errors.length}</strong>
                 </div>
                 <div className="btn-group">
                   <button className="btn-secondary" onClick={() => setStep(STEPS.MAPPING)}>Back to Mapping</button>
                   <button 
                     className="btn-primary" 
                     disabled={errors.length > 0 || loading}
                     onClick={handleFinalImport}
                   >
                     {loading ? 'Processing...' : 'Confirm & Import Stock'}
                   </button>
                 </div>
               </div>
            </div>
            {message && <div className={`msg-box floating ${message.type}`}>{message.text}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .checkin-container { max-width: 900px; margin: 0 auto; }
        .page-header { text-align: center; margin-bottom: 3rem; }
        .page-header h1 { font-size: 2.25rem; font-family: var(--font-outfit); margin-bottom: 8px; }
        .page-header p { color: var(--text-secondary); }

        .entry-options { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .option-card { padding: 3rem; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid var(--glass-border); cursor: pointer; transition: all 0.3s; }
        .option-card:hover { transform: translateY(-8px); border-color: var(--primary); background: rgba(255, 255, 255, 0.05); }
        .option-card .icon { margin-bottom: 1.5rem; }
        .option-card h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary); }
        .option-card p { color: var(--text-secondary); font-size: 0.875rem; }

        .entry-view { width: 100%; }
        .btn-back { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-bottom: 1.5rem; font-weight: 500; }
        .btn-back:hover { color: var(--text-primary); }

        .manual-form { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.875rem; color: var(--text-secondary); }
        .req { color: #ef4444; }
        .textarea { min-height: 80px; resize: vertical; }

        .msg-box { margin-top: 1rem; padding: 12px; border-radius: 10px; display: flex; align-items: center; gap: 10px; font-size: 0.875rem; }
        .msg-box.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .msg-box.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .msg-box.floating { position: fixed; bottom: 2rem; right: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 1000; animation: slideUp 0.3s ease; }

        .upload-step { padding: 4rem; }
        .upload-area { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .upload-area .icon-blue { color: #6366f1; margin-bottom: 2rem; }
        .upload-area p { margin-bottom: 2rem; color: var(--text-secondary); }
        .btn-upload { padding: 12px 32px; font-weight: 600; cursor: pointer; }

        .section-header { margin-bottom: 2rem; }
        .section-header h2 { font-family: var(--font-outfit); font-size: 1.5rem; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; color: var(--primary); }
        
        .mapping-card { padding: 2.5rem; }
        .mapping-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 2.5rem; }
        .mapping-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; }
        .field-info { display: flex; align-items: center; gap: 10px; }
        .field-name { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; }
        .req-label { font-size: 0.65rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 6px; border-radius: 4px; }
        .mapping-item select { background: var(--glass-bg); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 8px; border-radius: 8px; min-width: 180px; }

        .preview-card { padding: 2.5rem; max-width: 100%; overflow: hidden; }
        .preview-table-wrapper { max-height: 350px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 12px; margin-bottom: 2rem; }
        .modern-table.slim th { padding: 10px; font-size: 0.75rem; background: rgba(255,255,255,0.05); }
        .modern-table.slim td { padding: 10px; font-size: 0.85rem; }
        .row-error { background: rgba(239, 68, 68, 0.05); }
        .missing { color: #ef4444; font-weight: 700; font-size: 0.75rem; }
        
        .error-list { background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2) !important; padding: 1.5rem; margin-bottom: 1.5rem; max-height: 200px; overflow-y: auto; }
        .sticky-error-header { display: flex; align-items: center; gap: 10px; color: #ef4444; margin-bottom: 1rem; position: sticky; top: 0; }
        .error-list ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .error-list li { font-size: 0.8rem; color: #ef4444; font-weight: 500; }

        .actions { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 2rem; }
        .footer-actions { justify-content: space-between; align-items: center; }
        .stats-info { font-size: 0.875rem; color: var(--text-secondary); }
        .text-red { color: #ef4444; }

        .btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 10px 20px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border-color: var(--primary); }

        .icon-wrapper { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; transition: all 0.3s; }
        .icon-wrapper.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        .icon-wrapper.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .option-card:hover .icon-wrapper { transform: scale(1.1) rotate(5deg); }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default CheckIn;
