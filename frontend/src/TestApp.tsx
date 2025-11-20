import React from 'react';

const TestApp: React.FC = () => {
  console.log('TestApp rendering');
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1>Test App is Working!</h1>
      <p>If you can see this, React is working correctly.</p>
    </div>
  );
};

export default TestApp;
