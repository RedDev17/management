import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [completedClients, setCompletedClients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Map a DB row to camelCase
  const mapClient = (client) => ({
    id: client.id,
    date: client.date,
    clientName: client.client_name,
    packageAmount: client.package_amount,
    downPayment: client.down_payment,
    fullyPaid: client.fully_paid,
    salesCloser: client.sales_closer,
    devAssigned: client.dev_assigned,
    completedAt: client.completed_at,
    commissionPaid: client.commission_paid
  });

  // Load from Supabase
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) console.error("Failed to fetch clients:", error);
      if (data) {
        const mappedData = data.map(mapClient);
        // Split into active and completed
        setClients(mappedData.filter(c => !c.completedAt));
        setCompletedClients(mappedData.filter(c => c.completedAt));
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
        dev_assigned: client.devAssigned,
        commission_paid: client.commissionPaid || false
      };
      const { data, error } = await supabase.from('clients').insert([payload]).select().single();
      if (error) {
        console.error("Add failed", error);
        return { error: error.message };
      }
      const newClient = mapClient(data);
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
      if (updatedClient.commissionPaid !== undefined) payload.commission_paid = updatedClient.commissionPaid;

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

  const completeClient = async (id) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error } = await supabase
        .from('clients')
        .update({ completed_at: today })
        .eq('id', id);

      if (error) {
        console.error("Complete failed", error);
        return { error: error.message };
      }

      // Move from active to completed
      setClients(prev => {
        const client = prev.find(c => c.id === id);
        if (client) {
          const completedClient = { ...client, completedAt: today };
          setCompletedClients(cp => [...cp, completedClient]);
        }
        return prev.filter(c => c.id !== id);
      });

      return { error: null };
    } catch (err) {
      console.error("Complete failed", err);
      return { error: err.message };
    }
  };

  const toggleCommission = async (id, currentValue) => {
    try {
      const newValue = !currentValue;
      const { error } = await supabase
        .from('clients')
        .update({ commission_paid: newValue })
        .eq('id', id);

      if (error) {
        console.error("Toggle commission failed", error);
        return { error: error.message };
      }

      setClients(prev => prev.map(c => c.id === id ? { ...c, commissionPaid: newValue } : c));
      return { error: null };
    } catch (err) {
      console.error("Toggle commission failed", err);
      return { error: err.message };
    }
  };

  return (
    <ClientContext.Provider value={{
      clients,
      completedClients,
      addClient,
      updateClient,
      deleteClient,
      completeClient,
      toggleCommission
    }}>
      {children}
    </ClientContext.Provider>
  );
};
