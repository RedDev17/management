import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ProfileContext = createContext();

export const useProfiles = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);


  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.error("Profile fetch error", error);
    else if(data) {
        // Map snake_case to camelCase
        const mapped = data.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            email: p.email,
            status: p.status,
            paymentImage: p.payment_image // Map here
        }));
        setProfiles(mapped);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (profile) => {
    // Map camelCase to snake_case
    const payload = {
        name: profile.name,
        role: profile.role,
        email: profile.email,
        status: profile.status,
        payment_image: profile.paymentImage
    };

    const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
    if (error) {
        console.error("Add profile error", error);
        return { error: error.message };
    }
    // Map back result to state
    if (data) {
        const newProfile = {
            id: data.id,
            name: data.name,
            role: data.role,
            email: data.email,
            status: data.status,
            paymentImage: data.payment_image
        };
        setProfiles(prev => [...prev, newProfile]);
    }
    return { error: null };
  };

  const updateProfile = async (id, updatedData) => {
    // Determine what fields to update in snake_case
    const payload = {};
    if (updatedData.name !== undefined) payload.name = updatedData.name;
    if (updatedData.role !== undefined) payload.role = updatedData.role;
    if (updatedData.email !== undefined) payload.email = updatedData.email;
    if (updatedData.status !== undefined) payload.status = updatedData.status;
    if (updatedData.paymentImage !== undefined) payload.payment_image = updatedData.paymentImage;

    const { error } = await supabase.from('profiles').update(payload).eq('id', id);
    if (error) {
        console.error("Update profile error", error);
        return { error: error.message };
    }
    // Optimistic update with mapped keys
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
