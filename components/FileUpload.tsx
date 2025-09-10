import React, { useState, useCallback, useEffect } from 'react';
import type { FileState } from '../types';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  id: string;
  label: string;
  value: FileState | null;
  onFileChange: (fileState: FileState | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, value, onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // This effect creates and cleans up the object URL, making it safe for React 18 Strict Mode.
    // It depends on the file object itself, not the whole `value` object.
    if (value?.file) {
      const objectUrl = URL.createObjectURL(value.file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    // If there's no file, ensure preview is cleared.
    setPreview(null);
  }, [value?.file]);

  const handleFile = useCallback((file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      // The preview URL we pass up is not used for rendering in this component,
      // as it now manages its own preview URL via useEffect.
      const newFileState = { file, preview: '' };
      onFileChange(newFileState);
    } else {
      onFileChange(null);
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onFileChange(null);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <label
        htmlFor={id}
        className={`relative flex justify-center items-center w-full h-48 px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
        ${isDragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}
        ${preview ? 'p-0 border-solid' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="object-cover w-full h-full rounded-lg" />
            <button 
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            <div className="flex justify-center text-sm text-gray-400">
              <p className="pl-1">Drag and drop or <span className="font-semibold text-indigo-400">browse</span></p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        )}
        <input id={id} name={id} type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleChange} />
      </label>
    </div>
  );
};
