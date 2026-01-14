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
        if (data) {
            const mappedData = data.map(client => ({
                id: client.id,
                date: client.date,
                clientName: client.client_name,
                packageAmount: client.package_amount,
                downPayment: client.down_payment,
                fullyPaid: client.fully_paid,
                salesCloser: client.sales_closer,
                devAssigned: client.dev_assigned
            }));
            setClients(mappedData);
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
        const payload = {
            date: client.date,
            client_name: client.clientName,
            package_amount: client.packageAmount,
            down_payment: client.downPayment,
            fully_paid: client.fullyPaid,
            sales_closer: client.salesCloser,
            dev_assigned: client.devAssigned
        };
        const { data, error } = await supabase.from('clients').insert([payload]).select().single();
        if (error) {
            console.error("Add failed", error);
            return { error: error.message };
        }
        // Map back to camelCase for state
        const newClient = {
            id: data.id,
            date: data.date,
            clientName: data.client_name,
            packageAmount: data.package_amount,
            downPayment: data.down_payment,
            fullyPaid: data.fully_paid,
            salesCloser: data.sales_closer,
            devAssigned: data.dev_assigned
        };
        if (data) setClients(prev => [...prev, newClient]);
        return { error: null };
    } catch (err) {
        console.error("Add failed", err);
        return { error: err.message };
    }
  };

  const updateClient = async (id, updatedClient) => {
    try {
    const payload = {};
    if (updatedClient.date !== undefined) payload.date = updatedClient.date;
    if (updatedClient.clientName !== undefined) payload.client_name = updatedClient.clientName;
    if (updatedClient.packageAmount !== undefined) payload.package_amount = updatedClient.packageAmount;
    if (updatedClient.downPayment !== undefined) payload.down_payment = updatedClient.downPayment;
    if (updatedClient.fullyPaid !== undefined) payload.fully_paid = updatedClient.fullyPaid;
    if (updatedClient.salesCloser !== undefined) payload.sales_closer = updatedClient.salesCloser;
    if (updatedClient.devAssigned !== undefined) payload.dev_assigned = updatedClient.devAssigned;

        const { error } = await supabase.from('clients').update(payload).eq('id', id);
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
