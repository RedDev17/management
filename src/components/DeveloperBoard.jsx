import { useState } from 'react';
import { useClients } from '../context/ClientContext';
import { useProfiles } from '../context/ProfileContext';
import ClientTable from './ClientTable';
import DashboardStats from './DashboardStats';
import ProfileManager from './ProfileManager';
import ReceiptGenerator from './ReceiptGenerator';
import SalesTracker from './SalesTracker';
import ClientHistory from './ClientHistory';
import { User, Users, X, Settings, FileText, TrendingUp, LogOut, Clock } from 'lucide-react';
import './DeveloperBoard.css';

export default function DeveloperBoard({ onLogout }) {
  const { clients } = useClients();
  const { profiles } = useProfiles();
  const [selectedDev, setSelectedDev] = useState(null); // null = All (Master List)
  const [expandedData, setExpandedData] = useState(null); // { img: string, name: string }
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'profiles' | 'receipts' | 'sales' | 'history'
  const developersList = profiles; // All profiles from ProfileManager

  const getDevStats = (devName) => {
    const devClients = clients.filter(c => c.devAssigned === devName);
    const totalProjects = devClients.length;
    return { totalProjects };
  };

  // Filter clients for the board view
  const displayedClients = selectedDev 
    ? clients.filter(c => c.devAssigned === selectedDev)
    : clients;

  return (
    <div className="dev-board">
      <div className="sidebar-column">
        <div className="sidebar-header">
            <h1>WebNegosyo Management</h1>
        </div>
        
        <div className="sidebar-nav-scroll">
            <button 
              className={`nav-item ${selectedDev === null && viewMode === 'board' ? 'active' : ''}`}
              onClick={() => { setSelectedDev(null); setViewMode('board'); }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Users size={18} /> <span>Master List</span>
              </div>
            </button>

            <button 
              className={`nav-item ${viewMode === 'profiles' ? 'active' : ''}`}
              onClick={() => setViewMode('profiles')}
            >
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Settings size={18} /> <span>Manage Team</span>
              </div>
            </button>

            <button 
              className={`nav-item ${viewMode === 'receipts' ? 'active' : ''}`}
              onClick={() => setViewMode('receipts')}
            >
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <FileText size={18} /> <span>Receipts</span>
              </div>
            </button>

            <button 
              className={`nav-item ${viewMode === 'sales' ? 'active' : ''}`}
              onClick={() => setViewMode('sales')}
            >
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <TrendingUp size={18} /> <span>Sales</span>
              </div>
            </button>

            <button 
              className={`nav-item ${viewMode === 'history' ? 'active' : ''}`}
              onClick={() => setViewMode('history')}
            >
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Clock size={18} /> <span>History</span>
              </div>
            </button>
            
            <div className="nav-divider">Developers</div>

            {developersList.map(profile => {
              const devName = profile.name;
              const hasImage = profile.paymentImage;

              return (
                <button 
                  key={profile.id}
                  className={`nav-item ${selectedDev === devName && viewMode === 'board' ? 'active' : ''}`}
                  onClick={() => { setSelectedDev(devName); setViewMode('board'); }}
                >
                  <div style={{display: 'flex', alignItems: 'center', flex: 1}}>
                    <User size={18} /> 
                    <span style={{marginLeft: 8}}>{devName}</span>
                  </div>

                  <div className="dev-actions" style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    {hasImage && (
                        <div 
                          className="payment-thumb-mini"
                          onClick={(e) => { e.stopPropagation(); setExpandedData({ img: hasImage, name: devName }); }}
                          title="View Payment Image"
                        >
                          <img src={hasImage} alt="Pay" />
                        </div>
                    )}

                    <span className="count-badge">{getDevStats(devName).totalProjects}</span>
                  </div>
                </button>
              );
            })}
        </div>

        <div style={{padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
            <button 
                onClick={onLogout}
                className="nav-item"
                style={{
                    color: '#ef4444', 
                    justifyContent: 'center', 
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <LogOut size={18} /> <span>Logout</span>
                </div>
            </button>
        </div>
      </div>

      <div className="main-content">
        {viewMode === 'board' && (
          <>
            <DashboardStats clients={displayedClients} />
            <ClientTable filterDev={selectedDev} />
          </>
        )}
        {viewMode === 'profiles' && <ProfileManager />}
        {viewMode === 'receipts' && <ReceiptGenerator />}
        {viewMode === 'sales' && <SalesTracker clients={clients} />}
        {viewMode === 'history' && <ClientHistory />}
      </div>

      {/* Lightbox Modal */}
      {expandedData && (
        <div className="lightbox-overlay" onClick={() => setExpandedData(null)}>
          <button className="lightbox-close" onClick={() => setExpandedData(null)}>
            <X size={24} />
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>

            <img src={expandedData.img} alt="Expanded Payment" />
          </div>
        </div>
      )}
    </div>
  );
}
