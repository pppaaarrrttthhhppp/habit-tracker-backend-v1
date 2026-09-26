import React from 'react';
import NetworkGraph from '../components/NetworkGraph';
import './Pages.css';

const NetworkGraphPage = () => (
  <div className="page">
    <div className="page-header">
      <h1>Habit Influence Network</h1>
      <p>See how your habits spread through your friend circle. Drag nodes, scroll to zoom, click for details.</p>
    </div>

    <div className="glass-card widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <NetworkGraph height={520} limit={20} />
    </div>
  </div>
);

export default NetworkGraphPage;
