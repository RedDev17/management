import { useState } from 'react';
// import { supabase } from '../supabase';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
            setError(data.message || 'Invalid credentials');
        } else {
            onLogin(data.data);
        }
    } catch (err) {
        console.error(err);
        setError('Login failed. Check connection.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#0f172a',
        color: 'white'
    }}>
      <div style={{
          width: '100%', 
          maxWidth: '400px', 
          padding: '2rem', 
          background: '#1e293b', 
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem'}}>Admin Login</h2>
        
        {error && <div style={{
            background: 'rgba(248, 113, 113, 0.2)', 
            color: '#f87171', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            textAlign: 'center'
        }}>{error}</div>}

        <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#94a3b8'}}>Username</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        border: '1px solid #475569',
                        background: '#334155',
                        color: 'white',
                        outline: 'none'
                    }}
                    required
                />
            </div>
            
            <div style={{marginBottom: '2rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', color: '#94a3b8'}}>Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        border: '1px solid #475569',
                        background: '#334155',
                        color: 'white',
                        outline: 'none'
                    }}
                    required
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: 'none', 
                    background: '#3b82f6', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Authenticating...' : 'Sign In'}
            </button>
        </form>
      </div>
    </div>
  );
}
