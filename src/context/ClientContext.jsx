import { createContext, useContext, useState, useEffect } from 'react';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from API
  const fetchClients = async () => {
    try {
        const res = await fetch('http://localhost:3001/api/clients');
        const data = await res.json();
        if (data && data.data) {
            // Check if empty and we have local storage data -> IMPORT
            if (data.data.length === 0) {
                const localData = localStorage.getItem('clients');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    if (parsed.length > 0) {
                        console.log("Importing LocalStorage data to SQL...");
                        await importClients(parsed);
                        // Refetch after import
                        return fetchClients();
                    }
                }
            }
            setClients(data.data);
        }
    } catch (err) {
        console.error("Failed to fetch clients:", err);
    } finally {
        setLoaded(true);
    }
  };

  const importClients = async (localClients) => {
      try {
          await fetch('http://localhost:3001/api/clients/import', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ clients: localClients })
          });
      } catch (err) {
          console.error("Import failed", err);
      }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (client) => {
    try {
        const res = await fetch('http://localhost:3001/api/clients', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ...client, id: undefined }) // Let DB handle ID
        });
        const data = await res.json();
        if (data.data) {
            setClients(prev => [...prev, data.data]);
        }
    } catch (err) {
        console.error("Add failed", err);
    }
  };

  const updateClient = async (id, updatedClient) => {
    try {
        await fetch(`http://localhost:3001/api/clients/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedClient)
        });
        setClients(prev => prev.map(c => c.id === id ? { ...updatedClient, id } : c));
    } catch (err) {
        console.error("Update failed", err);
    }
  };

  const deleteClient = async (id) => {
    try {
        await fetch(`http://localhost:3001/api/clients/${id}`, {
             method: 'DELETE'
        });
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
