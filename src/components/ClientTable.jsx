import { useState, useEffect, useRef } from 'react';
import { useClients } from '../context/ClientContext';
import { useProfiles } from '../context/ProfileContext';
import { Plus, Trash2, Edit2, X, Save, Palette, RotateCcw, Paintbrush } from 'lucide-react';

export default function ClientTable({ filterDev }) {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { profiles } = useProfiles();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Column Colors State (Persisted)
  const defaultColors = { comm10: '#eff6ff', comm20: '#f5f3ff', comm5: '#fff7ed' };
  const [colColors, setColColors] = useState(() => {
    const saved = localStorage.getItem('columnColors');
    return saved ? JSON.parse(saved) : defaultColors;
  });
  const [showColorSettings, setShowColorSettings] = useState(false);

  // Cell Colors State (Persisted) - Map of "clientId-columnKey" -> hexColor
  const [cellColors, setCellColors] = useState(() => {
     const saved = localStorage.getItem('cellColors');
     return saved ? JSON.parse(saved) : {};
  });
  const [paintPopover, setPaintPopover] = useState(null); // { x, y, clientId, colKey }
  const [isPaintMode, setIsPaintMode] = useState(false);
  const paintInputRef = useRef(null);
  const [activeCellKey, setActiveCellKey] = useState(null);

  // Save colors when changed
  useEffect(() => {
    localStorage.setItem('columnColors', JSON.stringify(colColors));
  }, [colColors]);

  useEffect(() => {
    localStorage.setItem('cellColors', JSON.stringify(cellColors));
  }, [cellColors]);

  const handleColorChange = (key, val) => {
    setColColors(prev => ({ ...prev, [key]: val }));
  };

  const resetColors = () => {
    setColColors(defaultColors);
    setCellColors({});
  };

  // Paint Mode Handlers
  const handleCellClick = (e, clientId, colKey) => {
    if (!isPaintMode) return;
    
    // Position popover
    const rect = e.currentTarget.getBoundingClientRect();
    setPaintPopover({
        x: rect.left,
        y: rect.bottom, // Show below cell
        clientId, 
        colKey
    });
    setActiveCellKey(`${clientId}-${colKey}`);
  };

  const applyPaintColor = (color) => {
      if (paintPopover) {
        const key = `${paintPopover.clientId}-${paintPopover.colKey}`;
        setCellColors(prev => ({ ...prev, [key]: color }));
        setPaintPopover(null);
      }
  };

  const openCustomPicker = () => {
      paintInputRef.current?.click();
      setPaintPopover(null); // Close popover but keep active key
  };

  const handlePaintColorChange = (e) => {
    if (activeCellKey) {
        setCellColors(prev => ({
            ...prev,
            [activeCellKey]: e.target.value
        }));
    }
  };

  const SWATCHES = [
    '#bbf7d0', // Green
    '#bfdbfe', // Blue
    '#e9d5ff', // Purple
    '#fed7aa', // Orange
    '#fecaca', // Red
    '#fde047', // Yellow
    '#f3f4f6', // Gray/Reset
  ];

  // Get background color for a cell (Specific > Column > Default)
  const getCellColor = (clientId, colKey, defaultColColor) => {
      const cellKey = `${clientId}-${colKey}`;
      if (cellColors[cellKey]) return cellColors[cellKey];
      return defaultColColor;
  };

  // Filter Helper
  const checkTimeFilter = (clientDateStr) => {
    if (timeFilter === 'all') return true;
    if (!clientDateStr) return false;
    
    // Parse client date (MM/DD/YYYY to Date object)
    const cDate = new Date(clientDateStr);
    cDate.setHours(0,0,0,0);
    
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (timeFilter === 'week') {
      const diffTime = Math.abs(now - cDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 7;
    }
    
    if (timeFilter === 'month') {
      return cDate.getMonth() === now.getMonth() && cDate.getFullYear() === now.getFullYear();
    }

    if (timeFilter === 'custom') {
      if (!customStart || !customEnd) return true; // Show all if incomplete
      const start = new Date(customStart);
      const end = new Date(customEnd);
      // Include end date by adding time or normalize comparison
      return cDate >= start && cDate <= end;
    }
    
    return true;
  };
  
  // Filter clients
  const displayClients = clients.filter(c => {
    const matchesDev = filterDev ? c.devAssigned?.toLowerCase() === filterDev.toLowerCase() : true;
    const matchesTime = checkTimeFilter(c.date);
    return matchesDev && matchesTime;
  });

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Form State
  const initialForm = { 
    clientName: '', 
    packageAmount: 0, 
    downPayment: 0, 
    fullyPaid: 'Not', 
    salesCloser: '', 
    devAssigned: filterDev || '',
    date: getTodayString() // Auto-fill Today
  };
  const [formData, setFormData] = useState(initialForm);

  // Update default dev when filter changes
  useEffect(() => {
    if (filterDev) {
      setFormData(prev => ({ ...prev, devAssigned: filterDev }));
    }
  }, [filterDev]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName) return;
    
    // Auto-calc sales closer commission if left empty
    const finalData = { ...formData };
    if (!finalData.salesCloser && finalData.packageAmount) {
       finalData.salesCloser = (finalData.packageAmount * 0.10).toFixed(2);
    }

    // Default date if empty (New Client) or keep existing (Edit)
    if (!finalData.date) {
        finalData.date = new Date().toLocaleDateString();
    }

    let result;
    if (editingId) {
      result = await updateClient(editingId, finalData);
    } else {
      // If date was not set in form, set it now
      if (!finalData.date) finalData.date = new Date().toLocaleDateString();
      result = await addClient(finalData);
    }

    if (result && result.error) {
        alert("Failed to save client: " + result.error);
        return;
    }
    
    setEditingId(null); // Clear editing state strictly
    setFormData(initialForm);
    if(filterDev) setFormData(prev => ({...prev, devAssigned: filterDev}));
    setIsAdding(false);
  };

  const startEdit = (client) => {
    // Need to format date for input type="date" (YYYY-MM-DD)
    // Client date might be "1/14/2026" or "2026-01-14".
    let dateVal = '';
    if (client.date) {
        const d = new Date(client.date);
        if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split('T')[0];
        }
    }

    setFormData({ ...client, date: dateVal });
    setEditingId(client.id);
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(initialForm);
    if(filterDev) setFormData(prev => ({...prev, devAssigned: filterDev}));
  };

  // Helper to calculate percentages
  const formatCurrency = (amount) => {
    return '₱' + Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calcPercent = (amount, percent) => {
    if (!amount) return formatCurrency(0);
    return formatCurrency((amount * (percent / 100)));
  };

  return (
    <div className="sheet-container">
      {/* Popover Overlay */}
      {paintPopover && (
        <>
            <div 
                style={{position: 'fixed', inset: 0, zIndex: 998}} 
                onClick={() => setPaintPopover(null)} 
            />
            <div className="glass-panel" style={{
                position: 'fixed',
                top: paintPopover.y + 5,
                left: paintPopover.x,
                zIndex: 999,
                padding: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                width: '180px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                {SWATCHES.map(color => (
                    <button
                        key={color}
                        onClick={() => applyPaintColor(color)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: '2px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                        }}
                        title={color}
                    />
                ))}
                <button
                    onClick={openCustomPicker}
                    style={{
                         width: '32px',
                         height: '32px',
                         borderRadius: '50%',
                         background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                         border: '2px solid rgba(0,0,0,0.1)',
                         cursor: 'pointer',
                         display: 'flex', alignItems:'center', justifyContent:'center'
                    }}
                    title="Custom Color"
                >
                    <Plus size={14} color="white" style={{filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'}} />
                </button>
            </div>
        </>
      )}

      <div className="sheet-header">
        <h1>{filterDev ? `${filterDev}'s Clients` : 'Client Management'}</h1>
        
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
           {/* Color Picker Toggle */}
           <button 
             onClick={() => setShowColorSettings(!showColorSettings)}
             className={`sheet-input ${showColorSettings ? 'active' : ''}`}
             style={{
                width: 'auto', 
                padding: '0.4rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                borderColor: showColorSettings ? '#3b82f6' : ''
             }}
             title="Customize Column Colors"
           >
             <Palette size={16} /> <span style={{fontSize: '0.85rem'}}>Columns</span>
           </button>

            {/* Paint Mode Toggle */}
            <button 
             onClick={() => setIsPaintMode(!isPaintMode)}
             className={`sheet-input ${isPaintMode ? 'active' : ''}`}
             style={{
                width: 'auto', 
                padding: '0.4rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                borderColor: isPaintMode ? '#eab308' : '',
                backgroundColor: isPaintMode ? '#fefce8' : 'white'
             }}
             title="Paint Mode: Click specific cells to color them"
           >
             <Paintbrush size={16} color={isPaintMode ? '#ca8a04' : 'currentColor'} /> 
             <span style={{fontSize: '0.85rem', color: isPaintMode ? '#ca8a04' : 'currentColor'}}>Paint</span>
           </button>
           
           {/* Hidden Input for Paint Mode - triggered by Custom Swatch */}
           <input 
             type="color" 
             ref={paintInputRef} 
             style={{opacity: 0, position: 'absolute', pointerEvents: 'none'}} 
             onChange={handlePaintColorChange}
           />

           {showColorSettings && (
             <div className="glass-panel" style={{
               position: 'absolute',
               top: '60px',
               right: '340px', // Shifted left to accommodate new button
               zIndex: 100,
               padding: '1rem',
               display: 'flex',
               gap: '1rem',
               alignItems: 'center',
               boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
               border: '1px solid rgba(255,255,255,0.1)'
             }}>
                <div style={{textAlign: 'center'}}>
                  <label style={{display:'block', fontSize:'0.75rem', marginBottom:'4px'}}>10%</label>
                  <input type="color" value={colColors.comm10} onChange={(e) => handleColorChange('comm10', e.target.value)} />
                </div>
                <div style={{textAlign: 'center'}}>
                  <label style={{display:'block', fontSize:'0.75rem', marginBottom:'4px'}}>20%</label>
                  <input type="color" value={colColors.comm20} onChange={(e) => handleColorChange('comm20', e.target.value)} />
                </div>
                 <div style={{textAlign: 'center'}}>
                  <label style={{display:'block', fontSize:'0.75rem', marginBottom:'4px'}}>5%</label>
                  <input type="color" value={colColors.comm5} onChange={(e) => handleColorChange('comm5', e.target.value)} />
                </div>
                <button 
                  onClick={resetColors} 
                  style={{background: 'none', border:'none', cursor:'pointer', color:'#ef4444', marginLeft:'8px'}}
                  title="Reset Everything"
                >
                  <RotateCcw size={16} />
                </button>
             </div>
           )}

          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="sheet-input" 
            style={{padding: '0.25rem 0.5rem', width: 'auto'}}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeFilter === 'custom' && (
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
               <input 
                 type="date" 
                 value={customStart}
                 onChange={e => setCustomStart(e.target.value)}
                 className="sheet-input"
                 style={{width: 'auto', padding: '0.25rem'}}
               />
               <span style={{color: '#64748b'}}>-</span>
               <input 
                 type="date" 
                 value={customEnd}
                 onChange={e => setCustomEnd(e.target.value)}
                 className="sheet-input"
                 style={{width: 'auto', padding: '0.25rem'}}
               />
            </div>
          )}

          <button 
            className="btn-add"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="sheet-form">
          <div className="form-row">
            <div className="form-group" style={{maxWidth: '120px'}}>
              <label>Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="sheet-input"
              />
            </div>
            <div className="form-group">
              <label>Client Name</label>
              <input 
                type="text" 
                placeholder="Client Name" 
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                className="sheet-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Package Amount</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.packageAmount}
                onChange={e => setFormData({...formData, packageAmount: Number(e.target.value)})}
                className="sheet-input"
              />
            </div>
            <div className="form-group">
              <label>Down Payment</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.downPayment}
                onChange={e => setFormData({...formData, downPayment: Number(e.target.value)})}
                className="sheet-input"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select 
                value={formData.fullyPaid}
                onChange={e => setFormData({...formData, fullyPaid: e.target.value})}
                className="sheet-input"
              >
                <option value="Yes">Fully Paid: Yes</option>
                <option value="Not">Fully Paid: Not</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sales Closer (10%)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.salesCloser}
                onChange={e => setFormData({...formData, salesCloser: e.target.value})}
                className="sheet-input"
              />
            </div>
            <div className="form-group">
              <label>Dev Assigned</label>
              <select 
                value={formData.devAssigned}
                onChange={e => setFormData({...formData, devAssigned: e.target.value})}
                className="sheet-input"
                disabled={!!filterDev}
              >
                <option value="">-- Select Dev --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-actions" style={{alignSelf: 'flex-end', paddingBottom: '2px'}}>
              <button type="submit" className="btn-save"><Save size={16} /> Save</button>
              <button type="button" onClick={cancelForm} className="btn-cancel"><X size={16} /> Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="th-green">DATE</th>
              <th className="th-green">CLIENTNAME</th>
              <th className="th-green">PACKAGE AVAIL</th>
              <th className="th-green">DOWN PAYMENT</th>
              <th className="th-green">FULLY PAID</th>
              <th className="th-green">10% FOR SALES CLOSER</th>
              <th className="th-green">WEB/DEV ASSIGNED</th>
              <th className="th-green">10%</th>
              <th className="th-green">20%</th>
              <th className="th-green">5%</th>
              <th className="th-green">balance/natira</th>
              <th className="th-green">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {displayClients.map((client, index) => (
              <tr key={client.id} className={index % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                <td>{client.date || '-'}</td>
                <td>{client.clientName}</td>
                <td className="text-right">{formatCurrency(client.packageAmount)}</td>
                <td className="text-right">{formatCurrency(client.downPayment)}</td>
                <td>
                  <span className={`badge ${client.fullyPaid === 'Yes' ? 'badge-yes' : 'badge-not'}`}>
                    {client.fullyPaid}
                  </span>
                </td>
                <td className="text-right">
                    {client.salesCloser ? formatCurrency(client.salesCloser) : calcPercent(client.packageAmount, 10)}
                </td>
                <td>
                  <span className={`dev-pill dev-${client.devAssigned?.toLowerCase()}`}>
                    {client.devAssigned}
                  </span>
                </td>
                
                {/* 10% Column - Clickable in Paint Mode */}
                <td 
                    className="text-right" 
                    style={{
                        backgroundColor: getCellColor(client.id, 'comm10', colColors.comm10), 
                        color: '#1e3a8a',
                        cursor: isPaintMode ? 'cell' : 'default',
                        transition: 'background-color 0.2s'
                    }}
                    onClick={(e) => handleCellClick(e, client.id, 'comm10')}
                >
                    <strong>{calcPercent(client.packageAmount, 10)}</strong>
                </td>

                {/* 20% Column - Clickable in Paint Mode */}
                <td 
                    className="text-right" 
                    style={{
                        backgroundColor: getCellColor(client.id, 'comm20', colColors.comm20), 
                        color: '#581c87',
                        cursor: isPaintMode ? 'cell' : 'default',
                        transition: 'background-color 0.2s'
                    }}
                    onClick={(e) => handleCellClick(e, client.id, 'comm20')}
                >
                    <strong>{calcPercent(client.packageAmount, 20)}</strong>
                </td>

                {/* 5% Column - Clickable in Paint Mode */}
                <td 
                    className="text-right" 
                    style={{
                        backgroundColor: getCellColor(client.id, 'comm5', colColors.comm5), 
                        color: '#7c2d12',
                        cursor: isPaintMode ? 'cell' : 'default',
                        transition: 'background-color 0.2s'
                    }}
                    onClick={(e) => handleCellClick(e, client.id, 'comm5')}
                >
                    <strong>{calcPercent(client.packageAmount, 5)}</strong>
                </td>

                <td className="text-right font-bold text-red">
                  {formatCurrency(client.packageAmount - client.downPayment)}
                </td>
                <td className="cell-actions">
                  <button onClick={() => startEdit(client)} className="action-btn text-blue">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteClient(client.id)} className="action-btn text-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Summary Row */}
            <tr className="tr-summary">
              <td colSpan="2"><strong>TOTAL</strong></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.packageAmount || 0), 0))}</strong></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.downPayment || 0), 0))}</strong></td>
              <td colSpan="3"></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (Number(c.salesCloser) || (c.packageAmount * 0.10)), 0))}</strong></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.packageAmount * 0.10), 0))}</strong></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.packageAmount * 0.20), 0))}</strong></td>
              <td className="text-right"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.packageAmount * 0.05), 0))}</strong></td>
              <td className="text-right text-red"><strong>{formatCurrency(displayClients.reduce((sum, c) => sum + (c.packageAmount - c.downPayment), 0))}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
