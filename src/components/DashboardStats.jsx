import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardStats({ clients }) {
  // 1. Calculate Total Sales
  const totalSales = clients.reduce((sum, c) => sum + (c.packageAmount || 0), 0);
  
  // 2. Calculate Counts for Pie Chart
  const fullyPaidCount = clients.filter(c => c.fullyPaid === 'Yes').length;
  const notPaidCount = clients.filter(c => c.fullyPaid !== 'Yes').length; // 'Not' or others

  const pieData = [
    { name: 'Fully Paid', value: fullyPaidCount },
    { name: 'Not Paid', value: notPaidCount },
  ];

  const COLORS = ['#dcfce7', '#fee2e2']; // Matching our badge colors (light green, light red)
  // But for the chart, we might want slightly darker versions to be visible
  const CHART_COLORS = ['#166534', '#991b1b']; // Text colors from badges

  // 3. Calculate Percentages
  const total = clients.length || 1; // Avoid division by zero
  const fullyPaidPercent = ((fullyPaidCount / total) * 100).toFixed(0);
  const notPaidPercent = ((notPaidCount / total) * 100).toFixed(0);

  return (
    <div className="stats-container">
      {/* Total Sales Card */}
      <div className="stat-card">
        <h3>Total Sales</h3>
        <p className="stat-value">₱{totalSales.toLocaleString()}</p>
        <p className="stat-subtitle">Total Package Value</p>
      </div>

      {/* Pie Chart Card */}
      <div className="stat-card chart-card">
        <h3>Payment Status</h3>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
       
       {/* Count Summary Card */}
       <div className="stat-card">
        <h3>Projects</h3>
        <div className="stat-row">
            <span>Fully Paid:</span>
            <span className="badge badge-yes">
              {fullyPaidCount} <small>({fullyPaidPercent}%)</small>
            </span>
        </div>
        <div className="stat-row">
            <span>Not Paid:</span>
            <span className="badge badge-not">
              {notPaidCount} <small>({notPaidPercent}%)</small>
            </span>
        </div>
        <hr style={{margin: '0.5rem 0', borderColor: '#e2e8f0'}}/>
         <div className="stat-row">
            <strong>Total:</strong>
            <strong>{clients.length}</strong>
        </div>
      </div>
    </div>
  );
}
