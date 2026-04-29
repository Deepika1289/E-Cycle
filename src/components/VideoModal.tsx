// src/components/VideoModal.tsx

import React from 'react';

interface VideoModalProps {
  videoSrc: string;
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoSrc }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl mx-4 sm:mx-auto bg-black rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the video player
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 text-white bg-slate-800 rounded-full p-2 hover:bg-slate-700 transition-colors z-20"
          aria-label="Close video player"
        >
          <CloseIcon />
        </button>
        
        <div className="aspect-w-16 aspect-h-9">
          <video
            src={videoSrc || "watch-demo.mp4"}
            controls
            autoPlay
            className="w-full h-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};