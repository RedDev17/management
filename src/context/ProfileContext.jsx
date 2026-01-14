import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ProfileContext = createContext();

export const useProfiles = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        if (data) setProfiles(data);
    } catch (err) {
        console.error("Profile fetch error", err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (profile) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profile])
            .select();

        if (error) throw error;

        if (data) {
            setProfiles(prev => [...prev, data[0]]);
        }
    } catch (err) {
        console.error("Add profile error", err);
    }
  };

  const updateProfile = async (id, updatedData) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updatedData)
            .eq('id', id);

        if (error) throw error;

        setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    } catch (err) {
        console.error("Update profile error", err);
    }
  };

  const deleteProfile = async (id) => {
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
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
