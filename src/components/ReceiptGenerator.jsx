import { useState } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { FileText, Download } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import './ProfileManager.css'; // Re-use styles for consistency

export default function ReceiptGenerator() {
  const { profiles } = useProfiles();
  
  // Receipt Generator State
  const [receiptForm, setReceiptForm] = useState({
    devId: '',
    commission: ''
  });
  const [showReceipt, setShowReceipt] = useState(false);

  // Derived Receipt Data
  const selectedDev = profiles.find(p => p.id.toString() === receiptForm.devId);

  const handlePrintReceipt = () => {
    if(!selectedDev || !receiptForm.commission) return;
    setShowReceipt(true);
  };

  const receiptClientData = {
      id: 'MANUAL',
      commission: receiptForm.commission,
      devAssigned: selectedDev?.name
  };

  return (
    <section className="profile-manager section-padding">
      <div className="container">
        <div className="section-header">
          <h2>Receipt Generator</h2>
          <p>Create instant payout receipts for your team.</p>
        </div>

        <div className="glass-panel" style={{padding: '2rem'}}>
             <div className="receipt-form">
               <div className="form-group">
                 <label>Select Developer</label>
                 <select 
                    className="glass-input"
                    value={receiptForm.devId}
                    onChange={e => setReceiptForm({...receiptForm, devId: e.target.value})}
                 >
                   <option value="">-- Choose Member --</option>
                   {profiles.map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
               </div>
               
               <div className="form-group">
                 <label>Role (Auto)</label>
                 <input 
                   type="text" 
                   className="glass-input read-only-input" 
                   value={selectedDev?.role || '-'} 
                   readOnly 
                 />
               </div>

               <div className="form-group">
                 <label>Date (Auto)</label>
                 <input 
                   type="text" 
                   className="glass-input read-only-input" 
                   value={new Date().toLocaleDateString()} 
                   readOnly 
                 />
               </div>
               
               <div className="form-group">
                 <label>Commission Amount</label>
                 <input 
                   type="number" 
                   className="glass-input" 
                   placeholder="Enter Amount"
                   value={receiptForm.commission}
                   onChange={e => setReceiptForm({...receiptForm, commission: e.target.value})}
                   style={{fontWeight: 'bold', color: '#16a34a'}}
                 />
               </div>

               <div className="form-group" style={{display: 'flex', alignItems: 'flex-end'}}>
                 <button 
                  className="btn btn-primary" 
                  style={{width: '100%', justifyContent: 'center'}}
                  onClick={handlePrintReceipt}
                  disabled={!selectedDev || !receiptForm.commission}
                 >
                   <Download size={18} style={{marginRight: 8}} /> Download Receipt
                 </button>
               </div>
             </div>
        </div>
        
        {/* Receipt Modal */}
        <ReceiptModal 
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          client={receiptClientData}
          developer={selectedDev}
        />
      </div>
    </section>
  );
}
