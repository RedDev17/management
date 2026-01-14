import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ProfileContext = createContext();

export const useProfiles = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);


  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.error("Profile fetch error", error);
    else if(data) setProfiles(data);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (profile) => {
    const { data, error } = await supabase.from('profiles').insert([profile]).select().single();
    if (error) {
        console.error("Add profile error", error);
        return { error: error.message };
    }
    if (data) setProfiles(prev => [...prev, data]);
    return { error: null };
  };

  const updateProfile = async (id, updatedData) => {
    const { error } = await supabase.from('profiles').update(updatedData).eq('id', id);
    if (error) {
        console.error("Update profile error", error);
        return { error: error.message };
    }
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    return { error: null };
  };

  const deleteProfile = async (id) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
        console.error("Delete profile error", error);
        return { error: error.message };
    }
    setProfiles(prev => prev.filter(p => p.id !== id));
    return { error: null };
  };

  return (
    <ProfileContext.Provider value={{ profiles, addProfile, deleteProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
