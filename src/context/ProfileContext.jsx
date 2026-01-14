import { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const useProfiles = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const API_URL = '/api/profiles';

  const fetchProfiles = async () => {
    try {
        const res = await fetch(API_URL);
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
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to add profile');

        if (data.data) {
            setProfiles(prev => [...prev, data.data]);
        }
        return { error: null };
    } catch (err) {
        console.error("Add profile error", err);
        return { error: err.message };
    }
  };

  const updateProfile = async (id, updatedData) => {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to update profile');

        setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
        return { error: null };
    } catch (err) {
        console.error("Update profile error", err);
        return { error: err.message };
    }
  };

  const deleteProfile = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to delete profile');

        setProfiles(prev => prev.filter(p => p.id !== id));
        return { error: null };
    } catch (err) {
        console.error("Delete profile error", err);
        return { error: err.message };
    }
  };

  return (
    <ProfileContext.Provider value={{ profiles, addProfile, deleteProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
