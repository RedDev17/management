import React, { useRef } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import './ReceiptModal.css';

export default function ReceiptModal({ isOpen, onClose, client, developer }) {
  const receiptRef = useRef(null);

  if (!isOpen || !client) return null;

  const today = new Date().toLocaleDateString();
  const role = developer?.role || 'Developer';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  // If manual receipt, client.commission is passed directly.
  // If from ClientTable (older logic), we calculate.
  const commissionAmount = client.commission 
      ? client.commission 
      : (client.packageAmount * 0.05);

  const handleDownload = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2, // Higher quality
          backgroundColor: '#ffffff', // Ensure white background
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `WebNegosyo_Receipt_${Date.now()}.png`;
        link.click();
      } catch (error) {
        console.error("Error generating receipt image:", error);
        alert("Failed to generate receipt image. Please try again.");
      }
    }
  };

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={e => e.stopPropagation()}>
        <button className="btn-icon close-receipt-btn" onClick={onClose} style={{position: 'absolute', right: '1rem', top: '1rem'}}>
          <X size={20} />
        </button>

        <div className="receipt-content" ref={receiptRef}>
          <div className="receipt-header">
            <h1 className="brand-title">WebNegosyo</h1>
            <h2>OFFICIAL PAYOUT RECEIPT</h2>
            <div className="receipt-meta">Reference ID: #{Math.floor(Math.random() * 100000)}</div>
            <div className="receipt-meta">Date: {today}</div>
          </div>

          <div className="receipt-section">
            
            <div className="receipt-row">
                <span className="receipt-label">Recipient Name:</span>
                <span className="receipt-value">{developer?.name || client.devAssigned}</span>
            </div>
            <div className="receipt-row">
                <span className="receipt-label">Designation:</span>
                <span className="receipt-value">{role}</span>
            </div>
            
            <hr style={{margin: '1.5rem 0', borderColor: '#e2e8f0', borderStyle: 'dashed'}} />

            <div className="receipt-row total" style={{marginTop: '1rem', borderTop: 'none', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
              <span className="receipt-label" style={{fontSize: '1rem'}}>Total Commission Paid</span>
              <span className="receipt-value" style={{fontSize: '2rem', color: '#16a34a'}}>
                 {formatCurrency(commissionAmount)}
              </span>
            </div>
          </div>

          <div style={{marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8'}}>
            Authorized by WebNegosyo Management
          </div>
        </div>

        <div className="receipt-actions">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={16} style={{marginRight: 8}} /> Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
