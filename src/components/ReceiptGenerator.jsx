import { useState } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { FileText, Download } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import './ReceiptGenerator.css';

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

        <div className="receipt-generator-card">
             <div className="receipt-form">
               <div className="form-grid">
                 <div className="form-group col-span-2">
                   <label className="form-label">Select Developer</label>
                   <div className="input-wrapper">
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
                 </div>
                 
                 <div className="form-group">
                   <label className="form-label">Role (Auto)</label>
                   <input 
                     type="text" 
                     className="glass-input read-only-input" 
                     value={selectedDev?.role || '-'} 
                     readOnly 
                   />
                 </div>

                 <div className="form-group">
                   <label className="form-label">Date (Auto)</label>
                   <input 
                     type="text" 
                     className="glass-input read-only-input" 
                     value={new Date().toLocaleDateString()} 
                     readOnly 
                   />
                 </div>
               </div>
               
               <div className="form-group">
                 <label className="form-label">Commission Amount</label>
                 <div className="input-wrapper">
                    <span className="currency-symbol">₱</span>
                    <input 
                      type="number" 
                      className="glass-input amount-input" 
                      placeholder="0.00"
                      value={receiptForm.commission}
                      onChange={e => setReceiptForm({...receiptForm, commission: e.target.value})}
                    />
                 </div>
               </div>

               <button 
                className="btn btn-primary btn-generate" 
                onClick={handlePrintReceipt}
                disabled={!selectedDev || !receiptForm.commission}
               >
                 <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <Download size={20} />
                    <span>Generate & Download Receipt</span>
                 </div>
               </button>
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
