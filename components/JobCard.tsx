
import React from 'react';
import { Job, ServiceStatus, ServiceType } from '../types';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const statusTranslations = {
  [ServiceStatus.INSPECTING]: "قيد الفحص",
  [ServiceStatus.IN_PROGRESS]: "جاري العمل",
  [ServiceStatus.READY]: "جاهز للاستلام"
};

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.INSPECTING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ServiceStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-800 border-amber-200';
      case ServiceStatus.READY: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      onClick={() => onClick(job)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden flex flex-col group"
    >
      <div className="relative h-40 bg-gray-200 overflow-hidden">
        <img 
          src={job.motorcyclePhoto || `https://picsum.photos/seed/${job.id}/400/200`} 
          alt={job.client.model} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusColor(job.status)}`}>
          {statusTranslations[job.status]}
        </div>
        {job.serviceType === ServiceType.PICKUP_DELIVERY && (
          <div className="absolute top-3 left-3 bg-red-600 text-white p-2 rounded-lg shadow-lg flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span className="text-[10px] font-black uppercase">Delivery</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 truncate">{job.client.model}</h3>
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{job.client.licensePlate}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{job.client.name}</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-emerald-700 font-bold">{job.totalCost} جنيه</span>
          <span className="text-gray-400 font-medium text-xs">{job.client.dateIn}</span>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
