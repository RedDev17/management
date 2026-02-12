import { useState, useRef } from 'react';
import './ProfileManager.css';
import { useProfiles } from '../context/ProfileContext';
import { User, Mail, Briefcase, Trash2, Plus, X, Check, Edit2, Upload } from 'lucide-react';

export default function ProfileManager() {
  const { profiles, addProfile, deleteProfile, updateProfile } = useProfiles();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', role: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only Name is strictly required. Email/Role can be optional.
    if (!formData.name) {
        alert("Please enter a name.");
        return;
    }
    
    let result;
    if (editingId) {
      result = await updateProfile(editingId, formData);
    } else {
      result = await addProfile(formData);
    }

    if (result && result.error) {
        alert("Failed to save: " + result.error);
        console.error(result.error);
        return;
    }
    
    setEditingId(null);
    setFormData({ name: '', role: '', email: '' });
    setIsAdding(false);
  };

  const startEdit = (profile) => {
    setFormData(profile);
    setEditingId(profile.id);
    setIsAdding(true);
  };

  const fileInputRef = useRef(null);
  const [uploadingId, setUploadingId] = useState(null);

  const handleImageUpload = (e, profileId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit
      alert("Image is too large. Please minimize it to under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const { error } = await updateProfile(profileId, { paymentImage: reader.result });
      
      if (error) {
        // Show the actual error message from Supabase/Context
        alert("Failed to upload image: " + (error.message || error));
        console.error("Upload error details:", error);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (profileId) => {
    setUploadingId(profileId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', role: '', email: '' });
  };

  return (
    <section className="profile-manager section-padding">
      <div className="container">
        <div className="section-header">
          <h2>Team Profiles</h2>
          <p>Manage your team members and their roles.</p>
        </div>

        <div className="glass-panel table-container fade-in-up">
          <div className="table-actions">
            <h3 className="table-title">All Members ({profiles.length})</h3>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <Plus size={16} style={{marginRight: '0.5rem'}}/> Add Member
            </button>
          </div>

          {/* Hidden File Input for Image Uploads */}
          <input 
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => handleImageUpload(e, uploadingId)}
          />

          {isAdding && (
            <form onSubmit={handleSubmit} className="add-member-form slide-down">
              <div className="form-group">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="glass-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <Briefcase size={16} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Role (e.g. Developer)" 
                  value={formData.role || ''}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div className="form-group">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={formData.email || ''}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-icon-only">
                  <Check size={18} />
                </button>
                <button type="button" onClick={cancelForm} className="btn btn-outline btn-icon-only">
                  <X size={18} />
                </button>
              </div>
            </form>
          )}

          <div className="table-responsive">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => (
                  <tr key={profile.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {profile.name.charAt(0)}
                        </div>
                        <span className="user-name">{profile.name}</span>
                      </div>
                    </td>
                    <td><span className="badge role-badge">{profile.role}</span></td>
                    <td><span className="text-muted">{profile.email}</span></td>
                    <td>
                      <div 
                        className="payment-img-cell" 
                        onClick={() => triggerUpload(profile.id)}
                        title="Click to change payment image"
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {profile.paymentImage ? (
                          <div className="payment-preview">
                            <img src={profile.paymentImage} alt="Payment" className="payment-thumb" />
                            <div className="overlay">
                              <Edit2 size={12} color="white" />
                            </div>
                          </div>
                        ) : (
                          <button className="btn-icon-soft">
                            <Upload size={16} /> <span style={{marginLeft: 5, fontSize: '0.8rem'}}>Upload</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-dot ${profile.status === 'Offline' ? 'offline' : 'online'}`}></span>
                      {profile.status || 'Active'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => startEdit(profile)}
                          title="Edit"
                        >
                          <Edit2 size={16} color="#0f172a" />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => deleteProfile(profile.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">No profiles found. Add one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
