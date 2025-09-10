
export interface FileState {
  file: File;
  preview: string;
}

export type TaglineOption = 'user' | 'ai';

export interface AdConfig {
  brandName: string;
  taglineOption: TaglineOption;
  userTagline: string;
  aiTagline: string;
  colors: string[];
  layouts: string[];
  additionalElements: string[];
  numberOfImages: number;
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  refinementText: string;
}

export interface ImageAnalysis {
    description: string;
}
