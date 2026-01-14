import { useState } from 'react';
import { useClients } from '../context/ClientContext';
import { useProfiles } from '../context/ProfileContext';
import ClientTable from './ClientTable';
import DashboardStats from './DashboardStats';
import ProfileManager from './ProfileManager';
import ReceiptGenerator from './ReceiptGenerator';
import SalesTracker from './SalesTracker'; // Added import for SalesTracker
import { User, Users, X, Settings, FileText, TrendingUp } from 'lucide-react'; // Added TrendingUp import
import './DeveloperBoard.css';

export default function DeveloperBoard() {
  const { clients } = useClients();
  const { profiles } = useProfiles();
  const [selectedDev, setSelectedDev] = useState(null); // null = All (Master List)
  const [expandedImage, setExpandedImage] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'profiles' | 'receipts' | 'sales' // Updated viewMode options
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

            {/* Added Sales Tracker button */}
            <button 
              className={`nav-item ${viewMode === 'sales' ? 'active' : ''}`}
              onClick={() => setViewMode('sales')}
            >
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <TrendingUp size={18} /> <span>Sales</span>
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
                          onClick={(e) => { e.stopPropagation(); setExpandedImage(hasImage); }}
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
      </div>

      {/* Lightbox Modal */}
      {expandedImage && (
        <div className="lightbox-overlay" onClick={() => setExpandedImage(null)}>
          <button className="lightbox-close" onClick={() => setExpandedImage(null)}>
            <X size={24} />
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={expandedImage} alt="Expanded Payment" />
          </div>
        </div>
      )}
    </div>
  );
}
