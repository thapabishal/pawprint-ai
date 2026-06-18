import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="p-4 pt-safe animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="text-2xl font-extrabold text-dark mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-card shadow-card">
          <p className="text-sm text-muted">Total Dogs</p>
          <p className="text-2xl font-bold text-dark">--</p>
        </div>
        <div className="bg-white p-4 rounded-card shadow-card">
          <p className="text-sm text-muted">In Clinic</p>
          <p className="text-2xl font-bold text-dark text-status-catch">--</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
