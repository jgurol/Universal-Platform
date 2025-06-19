
import React from 'react';

export const Header = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600">Manage your agent commissions and track earnings</p>
      </div>
    </div>
  );
};
