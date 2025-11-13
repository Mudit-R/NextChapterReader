import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReaderFirebase = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D47249', textDecoration: 'none', fontWeight: 500 }}>← Back</button>
      <h1>Reader Firebase</h1>
      <p>This component will be implemented with Firebase integration.</p>
    </div>
  );
};

export default ReaderFirebase;

