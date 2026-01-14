import { useState, useEffect } from 'react';
// import { supabase } from '../supabase';
import { ChevronLeft, ChevronRight, PhilippinePeso, TrendingUp, Target, Calendar, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ComposedChart, Line, Legend, ResponsiveContainer } from 'recharts';
import './SalesTracker.css';

export default function SalesTracker({ clients = [] }) {
  // View Mode: 'month' (Daily breakdown) or 'year' (Monthly breakdown)
  const [viewMode, setViewMode] = useState('month');
  
  // Current Mon/Year View
  const [currentDate, setCurrentDate] = useState(new Date());

  // Budget State (Persisted via API)
  const [budgets, setBudgets] = useState({});

  // Fetch Budgets on Mount
  useEffect(() => {
    fetch('/api/budgets')
      .then(res => res.json())
      .then(data => {
          if(data.data) {
             setBudgets(data.data);
          }
      })
      .catch(err => console.error("Error loading budgets:", err));
  }, []);

  const yearKey = currentDate.getFullYear();
  const monthKey = `${yearKey}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const currentBudget = budgets[monthKey] || 0;

  // Save Budget
  const handleBudgetChange = async (e) => {
    const val = Number(e.target.value);
    const newBudgets = { ...budgets, [monthKey]: val };
    setBudgets(newBudgets); // Optimistic update

    // Save to API
    try {
        await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthKey, budgetAmount: val })
        });
    } catch (err) {
        console.error("Error saving budget:", err);
    }
  };


  // Navigate
  const changeDate = (delta) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + delta);
    } else {
        newDate.setFullYear(newDate.getFullYear() + delta);
    }
    setCurrentDate(newDate);
  };

  // Safe Clients Check
  const safeClients = Array.isArray(clients) ? clients : [];

  // ---------------------------
  // DATA PREP
  // ---------------------------
  
  // 1. Month View Data (Daily breakdown)
  const monthlySales = safeClients.filter(client => {
    if (!client || !client.date) return false;
    const cDate = new Date(client.date);
    if (isNaN(cDate.getTime())) return false;
    return cDate.getMonth() === currentDate.getMonth() && 
           cDate.getFullYear() === currentDate.getFullYear();
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day: day, sales: 0 };
  });

  monthlySales.forEach(client => {
      const cDate = new Date(client.date);
      if (!isNaN(cDate.getTime())) {
        const day = cDate.getDate();
        if (dailyData[day - 1]) {
            dailyData[day - 1].sales += (Number(client.packageAmount) || 0);
        }
      }
  });

  // 2. Year View Data (Monthly breakdown)
  const yearlySales = safeClients.filter(client => {
    if (!client || !client.date) return false;
    const cDate = new Date(client.date);
    if (isNaN(cDate.getTime())) return false;
    return cDate.getFullYear() === currentDate.getFullYear();
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearlyData = monthNames.map((name, index) => {
      const mKey = `${yearKey}-${String(index + 1).padStart(2, '0')}`;
      const monBudget = budgets[mKey] || 0;
      
      const salesInMonth = yearlySales
        .filter(c => new Date(c.date).getMonth() === index)
        .reduce((sum, c) => sum + (Number(c.packageAmount) || 0), 0);

      return {
          name,
          sales: salesInMonth,
          budget: monBudget
      };
  });


  // Stats Calculation
  // If in Year mode, show totals for the Year. If Month mode, show for Month.
  const displaySales = viewMode === 'month' 
      ? monthlySales.reduce((sum, c) => sum + (Number(c.packageAmount) || 0), 0)
      : yearlySales.reduce((sum, c) => sum + (Number(c.packageAmount) || 0), 0);
  
  const totalYearBudget = Object.keys(budgets)
      .filter(k => k.startsWith(`${yearKey}-`))
      .reduce((sum, k) => sum + budgets[k], 0);

  const displayBudget = viewMode === 'month' ? currentBudget : totalYearBudget;
  
  const percentage = displayBudget > 0 ? Math.min((displaySales / displayBudget) * 100, 100) : 0;
  const dealCount = viewMode === 'month' ? monthlySales.length : yearlySales.length;

  // Formatters
  const fmtMoney = (n) => n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const viewTitle = viewMode === 'month' 
    ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    : `Year ${currentDate.getFullYear()}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
            background: '#1e293b', 
            border: '1px solid rgba(255,255,255,0.1)', 
            padding: '8px 12px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <p style={{color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px'}}>
            {label}
          </p>
          {payload.map((p, i) => (
              <p key={i} style={{color: p.color, fontWeight: 'bold', fontSize: '0.9rem'}}>
                {p.name}: ₱{fmtMoney(p.value)}
              </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sales-tracker">
      {/* Header */}
      <div className="sales-header">
        <div className="month-nav">
          <button onClick={() => changeDate(-1)} className="nav-btn"><ChevronLeft size={24} /></button>
          <h2 style={{minWidth: '200px', textAlign: 'center'}}>{viewTitle}</h2>
          <button onClick={() => changeDate(1)} className="nav-btn"><ChevronRight size={24} /></button>
        </div>

        <div className="view-toggles" style={{display:'flex', gap:'8px', background:'rgba(255,255,255,0.05)', padding:'4px', borderRadius:'8px'}}>
            <button 
                onClick={() => setViewMode('month')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'month' ? '#3b82f6' : 'transparent',
                    color: viewMode === 'month' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontWeight: 500
                }}
            >
                <Calendar size={14} /> Month
            </button>
            <button 
                onClick={() => setViewMode('year')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'year' ? '#3b82f6' : 'transparent',
                    color: viewMode === 'year' ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontWeight: 500
                }}
            >
                <BarChart2 size={14} /> Year
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="sales-stats-grid">
        {/* Total Sales Card */}
        <div className="sales-card">
          <h3><PhilippinePeso size={16} className="text-green" /> {viewMode === 'month' ? 'Monthly' : 'Yearly'} Revenue</h3>
          <div className="sales-value text-green">₱{fmtMoney(displaySales)}</div>
          <div className="progress-text">
            <span>{dealCount} Deals Closed</span>
          </div>
        </div>

        {/* Budget Card */}
        <div className="sales-card">
          <h3><Target size={16} className="text-blue" /> {viewMode === 'month' ? 'Monthly' : 'Yearly'} Target</h3>
          
          {viewMode === 'month' ? (
              <div className="budget-input-container">
                <span style={{fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc'}}>₱</span>
                <input 
                  type="number" 
                  className="budget-input"
                  value={currentBudget || ''} 
                  onChange={handleBudgetChange}
                  placeholder="0.00"
                />
              </div>
          ) : (
              // In Year View, show the total accumulated budget
              <div className="sales-value text-white">₱{fmtMoney(displayBudget)}</div>
          )}
          
          <div className="progress-container">
            <div className="progress-bar-bg">
                <div 
                    className="progress-bar-fill" 
                    style={{
                        width: `${percentage}%`,
                        background: percentage >= 100 ? '#4ade80' : '#3b82f6'
                    }}
                />
            </div>
            <div className="progress-text">
                <span>{percentage.toFixed(1)}% Achieved</span>
                <span>₱{fmtMoney(Math.max(displayBudget - displaySales, 0))} Remaining</span>
            </div>
          </div>
        </div>

        {/* Performance / Average Card */}
        <div className="sales-card">
          <h3><TrendingUp size={16} className="text-purple" /> Average Deal</h3>
          <div className="sales-value text-purple">
            ₱{dealCount ? fmtMoney(displaySales / dealCount) : '0.00'}
          </div>
           <div className="progress-text">
            <span>Per Client Average</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="sales-card" style={{ marginBottom: '2rem', height: '360px', display:'flex', flexDirection:'column' }}>
          <h3><TrendingUp size={16} className="text-blue" /> {viewMode === 'month' ? 'Daily Sales Trend' : 'Monthly Performance Analysis'}</h3>
          <div style={{flex: 1, width: '100%', minHeight: '250px'}}>
            <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'month' ? (
                    <BarChart data={dailyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="day" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            interval={1}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => `₱${val/1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar name="Sales" dataKey="sales" radius={[4, 4, 0, 0]}>
                            {dailyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.sales > 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)'} />
                            ))}
                        </Bar>
                    </BarChart>
                ) : (
                    <ComposedChart data={yearlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => `₱${val/1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Legend wrapperStyle={{paddingTop: '10px'}} />
                        <Bar name="Actual Sales" dataKey="sales" barSize={20} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" name="Target Budget" dataKey="budget" stroke="#4ade80" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                    </ComposedChart>
                )}
            </ResponsiveContainer>
          </div>
      </div>

      {/* Sales List */}
      <div className="sales-list">
        <div className="sales-list-header">
            <h3>Transaction History ({viewMode === 'month' ? monthNames[currentDate.getMonth()] : `All ${currentDate.getFullYear()}`})</h3>
        </div>
        
        {(viewMode === 'month' ? monthlySales : yearlySales).length > 0 ? (
            <table className="sales-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Package</th>
                        <th>Status</th>
                        <th>Assigned</th>
                    </tr>
                </thead>
                <tbody>
                    {(viewMode === 'month' ? monthlySales : yearlySales)
                        .sort((a,b) => new Date(b.date) - new Date(a.date)) // Sort newest status first
                        .map(sale => (
                        <tr key={sale.id}>
                            <td>{sale.date}</td>
                            <td>{sale.clientName}</td>
                            <td className="text-green font-bold">₱{fmtMoney(sale.packageAmount)}</td>
                            <td>
                                <span style={{
                                    padding: '2px 8px', 
                                    borderRadius:'12px', 
                                    fontSize:'0.75rem', 
                                    background: sale.fullyPaid === 'Yes' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                                    color: sale.fullyPaid === 'Yes' ? '#4ade80' : '#f87171'
                                }}>
                                    {sale.fullyPaid === 'Yes' ? 'Paid' : 'Unpaid'}
                                </span>
                            </td>
                            <td>{sale.devAssigned}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="no-sales">
                <p>No sales recorded for this period.</p>
            </div>
        )}
      </div>

    </div>
  );
}
