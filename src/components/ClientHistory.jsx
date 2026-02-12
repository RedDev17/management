import { useState } from 'react';
import { useClients } from '../context/ClientContext';
import { Search, Calendar, ChevronDown } from 'lucide-react';

export default function ClientHistory() {
  const { completedClients } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Format currency
  const formatCurrency = (amount) => {
    return '₱' + Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Group completed clients by month
  const groupByMonth = (clients) => {
    const groups = {};
    clients.forEach(client => {
      if (!client.completedAt) return;
      const date = new Date(client.completedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = { label: monthLabel, clients: [] };
      }
      groups[monthKey].clients.push(client);
    });
    return groups;
  };

  // Filter by search
  const filteredClients = completedClients.filter(c => {
    const matchesSearch = searchQuery
      ? c.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesMonth = selectedMonth !== 'all'
      ? (() => {
          const date = new Date(c.completedAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return key === selectedMonth;
        })()
      : true;
    return matchesSearch && matchesMonth;
  });

  const grouped = groupByMonth(filteredClients);

  // Sort months descending (newest first)
  const sortedMonthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Get all unique months for filter dropdown
  const allMonths = {};
  completedClients.forEach(c => {
    if (!c.completedAt) return;
    const date = new Date(c.completedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    allMonths[key] = label;
  });
  const sortedAllMonthKeys = Object.keys(allMonths).sort((a, b) => b.localeCompare(a));

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h1>Completed Clients History</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Month Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8', pointerEvents: 'none' }} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="sheet-input"
              style={{ paddingLeft: '32px', width: 'auto', minWidth: '180px' }}
            >
              <option value="all">All Months</option>
              {sortedAllMonthKeys.map(key => (
                <option key={key} value={key}>{allMonths[key]}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sheet-input"
              style={{ paddingLeft: '32px', width: '200px' }}
            />
          </div>
        </div>
      </div>

      {sortedMonthKeys.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8'
        }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b' }}>No Completed Clients Yet</h3>
          <p>When you mark clients as completed, they'll appear here grouped by month.</p>
        </div>
      )}

      {sortedMonthKeys.map(monthKey => (
        <div key={monthKey} style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '0.75rem', padding: '0.5rem 0'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', padding: '0.4rem 1rem', borderRadius: '8px',
              fontWeight: '600', fontSize: '0.95rem'
            }}>
              {grouped[monthKey].label}
            </div>
            <span style={{
              color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500'
            }}>
              {grouped[monthKey].clients.length} client{grouped[monthKey].clients.length !== 1 ? 's' : ''}
            </span>
            <div style={{
              flex: 1, height: '1px', background: '#e2e8f0'
            }} />
          </div>

          <div className="table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  <th className="th-green">COMPLETED</th>
                  <th className="th-green">DATE</th>
                  <th className="th-green">CLIENT NAME</th>
                  <th className="th-green">PACKAGE</th>
                  <th className="th-green">DOWN PAYMENT</th>
                  <th className="th-green">STATUS</th>
                  <th className="th-green">DEV ASSIGNED</th>
                  <th className="th-green">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {grouped[monthKey].clients.map((client, index) => (
                  <tr key={client.id} className={index % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                    <td>
                      <span style={{
                        background: '#dcfce7', color: '#16a34a',
                        padding: '2px 10px', borderRadius: '12px',
                        fontSize: '0.8rem', fontWeight: '600'
                      }}>
                        {new Date(client.completedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>{client.date || '-'}</td>
                    <td><strong>{client.clientName}</strong></td>
                    <td className="text-right">{formatCurrency(client.packageAmount)}</td>
                    <td className="text-right">{formatCurrency(client.downPayment)}</td>
                    <td>
                      <span className={`badge ${client.fullyPaid === 'Yes' ? 'badge-yes' : 'badge-not'}`}>
                        {client.fullyPaid}
                      </span>
                    </td>
                    <td>
                      <span className={`dev-pill dev-${client.devAssigned?.toLowerCase()}`}>
                        {client.devAssigned}
                      </span>
                    </td>
                    <td className="text-right font-bold text-red">
                      {formatCurrency(client.packageAmount - client.downPayment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
