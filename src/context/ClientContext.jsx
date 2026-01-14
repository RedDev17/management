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
        if (error) throw error;
        
        if (data) {
             setClients(data);
        }
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
        const { id, ...dataToInsert } = client; // Remove ID if present to let DB handle it
        const { data, error } = await supabase
            .from('clients')
            .insert([dataToInsert])
            .select();
            
        if (error) throw error;

        if (data) {
            setClients(prev => [...prev, data[0]]);
        }
    } catch (err) {
        console.error("Add failed", err);
    }
  };

  const updateClient = async (id, updatedClient) => {
    try {
        const { error } = await supabase
            .from('clients')
            .update(updatedClient)
            .eq('id', id);

        if (error) throw error;

        setClients(prev => prev.map(c => c.id === id ? { ...updatedClient, id } : c));
    } catch (err) {
        console.error("Update failed", err);
    }
  };

  const deleteClient = async (id) => {
    try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
        console.error("Delete failed", err);
    }
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
};
