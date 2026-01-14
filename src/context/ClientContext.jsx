import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from Supabase
  const fetchClients = async () => {
    try {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) console.error("Failed to fetch clients:", error);
        if (data) setClients(data);
    } catch (err) {
        console.error("Failed to fetch clients:", err);
    } finally {
        setLoaded(true);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (client) => {
    try {
        const { data, error } = await supabase.from('clients').insert([client]).select().single();
        if (error) {
            console.error("Add failed", error);
            return { error: error.message };
        }
        if (data) setClients(prev => [...prev, data]);
        return { error: null };
    } catch (err) {
        console.error("Add failed", err);
        return { error: err.message };
    }
  };

  const updateClient = async (id, updatedClient) => {
    try {
        const { error } = await supabase.from('clients').update(updatedClient).eq('id', id);
        if (error) {
            console.error("Update failed", error);
            return { error: error.message };
        }
        setClients(prev => prev.map(c => c.id === id ? { ...updatedClient, id } : c));
        return { error: null };
    } catch (err) {
        console.error("Update failed", err);
        return { error: err.message };
    }
  };

  const deleteClient = async (id) => {
    try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
            console.error("Delete failed", error);
            return { error: error.message };
        }
        setClients(prev => prev.filter(c => c.id !== id));
        return { error: null };
    } catch (err) {
        console.error("Delete failed", err);
        return { error: err.message };
    }
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
};
