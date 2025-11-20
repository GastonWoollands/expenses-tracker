import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Expenses Tracker
        </h2>
        <p style={{ 
          textAlign: 'center', 
          fontSize: '0.875rem', 
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Welcome to your personal expense management system
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button style={{
            width: '100%',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Sign In
          </button>
          <button style={{
            width: '100%',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
