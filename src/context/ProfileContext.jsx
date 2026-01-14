import { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const useProfiles = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = async () => {
    try {
        const res = await fetch('http://localhost:3001/api/profiles');
        const data = await res.json();
        if (data.data) setProfiles(data.data);
    } catch (err) {
        console.error("Profile fetch error", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (profile) => {
    try {
        const res = await fetch('http://localhost:3001/api/profiles', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(profile)
        });
        const data = await res.json();
        if (data.data) {
            setProfiles(prev => [...prev, data.data]);
        }
    } catch (err) {
        console.error("Add profile error", err);
    }
  };

  const updateProfile = async (id, updatedData) => {
    try {
        await fetch(`http://localhost:3001/api/profiles/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedData)
        });
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    } catch (err) {
        console.error("Update profile error", err);
    }
  };

  const deleteProfile = async (id) => {
    try {
        await fetch(`http://localhost:3001/api/profiles/${id}`, { method: 'DELETE' });
        setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
        console.error("Delete profile error", err);
    }
  };

  return (
    <ProfileContext.Provider value={{ profiles, addProfile, deleteProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
