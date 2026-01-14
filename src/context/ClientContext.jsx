import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from Backend API
  const fetchClients = async () => {
    try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (data.data) {
             setClients(data.data);
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
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to add client');

        if (data.data) {
            setClients(prev => [...prev, data.data]);
        }
        return { error: null };
    } catch (err) {
        console.error("Add failed", err);
        return { error: err.message };
    }
  };

  const updateClient = async (id, updatedClient) => {
    try {
        const res = await fetch(`/api/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClient)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to update client');

        setClients(prev => prev.map(c => c.id === id ? { ...updatedClient, id } : c));
        return { error: null };
    } catch (err) {
        console.error("Update failed", err);
        return { error: err.message };
    }
  };

  const deleteClient = async (id) => {
    try {
        const res = await fetch(`/api/clients/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to delete client');

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
