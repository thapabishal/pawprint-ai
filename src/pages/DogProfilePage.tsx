import React from 'react';
import { useParams } from 'react-router-dom';

const DogProfilePage: React.FC = () => {
  const { id } = useParams();
  return (
    <div className="p-4 pt-safe animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="text-2xl font-extrabold text-dark mb-4">Dog Profile</h1>
      <div className="bg-white p-6 rounded-card shadow-card">
        <p className="text-body">Profile for dog: {id}</p>
      </div>
    </div>
  );
};

export default DogProfilePage;
