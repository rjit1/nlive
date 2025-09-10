
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DownloadIcon, SparklesIcon, RefreshIcon } from './components/Icons';
import { PRESET_COLORS, LAYOUT_OPTIONS, ELEMENT_OPTIONS } from './constants';
import * as geminiService from './services/geminiService';
import type { AdConfig, FileState, GeneratedImage, TaglineOption } from './types';

const Header: React.FC = () => (
  <header className="py-4 px-4 md:px-8 border-b border-gray-700">
    <div className="flex items-center space-x-3">
      <div className="text-3xl">👕</div>
      <h1 className="text-2xl font-bold text-white tracking-tight">E-Commerce Clothing Ad Generator</h1>
    </div>
  </header>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-800 rounded-lg">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
      <p className="mt-4 text-lg font-semibold text-white">Generating Your Ads...</p>
      <p className="text-gray-400">{message}</p>
    </div>
);

interface OptionPanelProps {
  config: AdConfig;
  modelImage: FileState | null;
  productImage: FileState | null;
  logoImage: FileState | null;
  aiTaglineSuggestions: string[];
  isLoading: boolean;
  onModelImageChange: (file: FileState | null) => void;
  onProductImageChange: (file: FileState | null) => void;
  onLogoImageChange: (file: FileState | null) => void;
  onConfigChange: <K extends keyof AdConfig>(key: K, value: AdConfig[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateTaglines: () => void;
}

const OptionPanel: React.FC<OptionPanelProps> = ({
  config,
  modelImage,
  productImage,
  logoImage,
  aiTaglineSuggestions,
  isLoading,
  onModelImageChange,
  onProductImageChange,
  onLogoImageChange,
  onConfigChange,
  onSubmit,
  onGenerateTaglines,
}) => (
   <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload id="model-image" label="Model Image" value={modelImage} onFileChange={onModelImageChange} />
          <FileUpload id="product-image" label="Product Photo" value={productImage} onFileChange={onProductImageChange} />
      </div>
      <div>
           <label htmlFor="brandName" className="block text-sm font-medium text-gray-300">Brand Name (optional)</label>
           <input type="text" id="brandName" value={config.brandName} onChange={e => onConfigChange('brandName', e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
       <FileUpload id="logo-image" label="Brand Logo (optional)" value={logoImage} onFileChange={onLogoImageChange} />
      
       <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Tagline</label>
          <div className="flex space-x-4">
              {(['ai', 'user'] as TaglineOption[]).map(opt => (
                  <div key={opt} className="flex items-center">
                      <input id={`tagline-${opt}`} type="radio" value={opt} checked={config.taglineOption === opt} onChange={() => onConfigChange('taglineOption', opt)} className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500" />
                      <label htmlFor={`tagline-${opt}`} className="ml-2 block text-sm text-gray-300">{opt === 'ai' ? 'AI-Generated' : 'Your Own'}</label>
                  </div>
              ))}
          </div>
          {config.taglineOption === 'user' ? (
               <input type="text" value={config.userTagline} onChange={e => onConfigChange('userTagline', e.target.value)} placeholder="e.g., Oversized Comfort" className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          ) : (
              <div className="flex items-stretch space-x-2">
                  <select value={config.aiTagline} onChange={e => onConfigChange('aiTagline', e.target.value)} className="block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50" disabled={aiTaglineSuggestions.length === 0}>
                      {aiTaglineSuggestions.length === 0 ? <option>Click 'Generate' to get ideas</option> : aiTaglineSuggestions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                  <button type="button" onClick={onGenerateTaglines} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50" disabled={!productImage}>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Generate</span>
                  </button>
              </div>
          )}
       </div>

      <div>
          <label className="block text-sm font-medium text-gray-300">Color Variations (up to 10)</label>
          <div className="mt-2 grid grid-cols-5 gap-2">
              {PRESET_COLORS.map(color => {
                  const isSelected = config.colors.includes(color.name);
                  return <button 
                    key={color.hex} 
                    type="button" 
                    title={color.name}
                    onClick={() => {
                      const newColors = isSelected 
                        ? config.colors.filter(c => c !== color.name) 
                        : [...config.colors, color.name].slice(0, 10);
                      onConfigChange('colors', newColors);
                    }} 
                    className={`w-full h-10 rounded-md border-2 ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-gray-600'}`} 
                    style={{ backgroundColor: color.hex }}
                  ></button>
              })}
          </div>
      </div>

      <div>
          <label htmlFor="layouts" className="block text-sm font-medium text-gray-300">Views/Layouts</label>
          <select id="layouts" value={config.layouts[0]} onChange={e => onConfigChange('layouts', [e.target.value])} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {LAYOUT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
      </div>

      <div>
           <label className="block text-sm font-medium text-gray-300">Additional Elements</label>
           <div className="mt-2 grid grid-cols-2 gap-2">
              {ELEMENT_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center">
                      <input id={`element-${opt}`} type="checkbox" checked={config.additionalElements.includes(opt)} onChange={e => {
                          const newElements = e.target.checked ? [...config.additionalElements, opt] : config.additionalElements.filter(el => el !== opt);
                          onConfigChange('additionalElements', newElements);
                      }} className="h-4 w-4 text-indigo-600 border-gray-500 rounded focus:ring-indigo-500"/>
                       <label htmlFor={`element-${opt}`} className="ml-2 block text-sm text-gray-300">{opt}</label>
                  </div>
              ))}
           </div>
      </div>

      <div>
           <label htmlFor="numImages" className="block text-sm font-medium text-gray-300">Number of Ads: {config.numberOfImages}</label>
           <input id="numImages" type="range" min="1" max="8" value={config.numberOfImages} onChange={e => onConfigChange('numberOfImages', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
      </div>
      
      <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed">
           {isLoading ? 'Generating...' : <> <SparklesIcon className="w-5 h-5 mr-2" /> Generate Ads</>}
      </button>
   </form>
);

interface GalleryProps {
  images: GeneratedImage[];
  onRegenerate: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ images, onRegenerate, isLoading }) => (
    <div className="space-y-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
                <div key={image.id} className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <img src={image.src} alt={`Generated Ad ${index + 1}`} className="w-full h-auto object-contain aspect-[4/5]"/>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                        <a href={image.src} download={`ad-${index+1}.png`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white/10 text-white rounded-full backdrop-blur-sm hover:bg-white/20">
                            <DownloadIcon className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            ))}
        </div>
        {images.length > 0 && <button onClick={onRegenerate} disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-indigo-500 rounded-md shadow-sm text-sm font-medium text-indigo-300 hover:bg-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            <RefreshIcon className="w-5 h-5 mr-2" />
            Regenerate All
        </button>}
    </div>
);


const App: React.FC = () => {
    const [modelImage, setModelImage] = useState<FileState | null>(null);
    const [productImage, setProductImage] = useState<FileState | null>(null);
    const [logoImage, setLogoImage] = useState<FileState | null>(null);
    const [config, setConfig] = useState<AdConfig>({
        brandName: '',
        taglineOption: 'ai',
        userTagline: '',
        aiTagline: '',
        colors: [],
        layouts: [LAYOUT_OPTIONS[0]],
        additionalElements: [],
        numberOfImages: 3,
    });
    const [aiTaglineSuggestions, setAiTaglineSuggestions] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    const handleConfigChange = useCallback(<K extends keyof AdConfig>(key: K, value: AdConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleGenerateTaglines = async () => {
        if (!productImage) {
            setError("Please upload a product image first.");
            return;
        }
        setError(null);
        try {
            setProgressMessage("Generating tagline suggestions...");
            setIsLoading(true);
            const productDesc = await geminiService.analyzeImage(productImage.file, 'product');
            const taglines = await geminiService.generateTaglines(productDesc);
            setAiTaglineSuggestions(taglines);
            if (taglines.length > 0) {
                handleConfigChange('aiTagline', taglines[0]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate taglines.");
        } finally {
            setIsLoading(false);
            setProgressMessage("");
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modelImage || !productImage) {
            setError("Please upload both a model and a product image.");
            return;
        }
        if (config.colors.length === 0) {
            setError("Please select at least one color variation.");
            return;
        }
        setError(null);
        setGeneratedImages([]);
        setIsLoading(true);

        try {
            setProgressMessage("Analyzing images...");
            const [modelDesc, productDesc] = await Promise.all([
                geminiService.analyzeImage(modelImage.file, 'model'),
                geminiService.analyzeImage(productImage.file, 'product')
            ]);
            
            setProgressMessage("Generating creative prompts...");
            const prompts = await geminiService.generateAdPrompts(modelDesc, productDesc, config);

            const imagesToGenerate = prompts.slice(0, config.numberOfImages);
            const total = imagesToGenerate.length;

            // Concurrency-limited generation (worker pool)
            const concurrency = Math.min(3, total); // tuneable
            const results: (GeneratedImage | null)[] = Array(total).fill(null);
            let nextIndex = 0;
            let completed = 0;

            setProgressMessage(`Generating 0/${total} (upto ${concurrency} at a time)...`);

            const worker = async () => {
              while (true) {
                const i = nextIndex++;
                if (i >= total) break;
                try {
                  const prompt = imagesToGenerate[i];
                  const imageUrl = await geminiService.generateAdImage(
                    modelImage.file,
                    productImage.file,
                    prompt,
                    logoImage?.file
                  );
                  results[i] = { id: `img-${i}-${Date.now()}`, src: imageUrl, prompt, refinementText: '' };
                } catch (e) {
                  // Keep slot empty on error, but continue other generations
                  console.error('Image generation failed for index', i, e);
                } finally {
                  completed++;
                  setProgressMessage(`Generating ${completed}/${total} (upto ${concurrency} at a time)...`);
                  // Update gallery with completed images in order
                  const partial = results.filter((x): x is GeneratedImage => !!x);
                  setGeneratedImages(partial);
                }
              }
            };

            await Promise.all(Array.from({ length: concurrency }, () => worker()));

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during generation.");
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-2xl h-fit">
                        <h2 className="text-xl font-semibold text-white mb-4">Ad Configuration</h2>
                        <OptionPanel 
                            config={config}
                            modelImage={modelImage}
                            productImage={productImage}
                            logoImage={logoImage}
                            aiTaglineSuggestions={aiTaglineSuggestions}
                            isLoading={isLoading}
                            onModelImageChange={setModelImage}
                            onProductImageChange={setProductImage}
                            onLogoImageChange={setLogoImage}
                            onConfigChange={handleConfigChange}
                            onSubmit={handleSubmit}
                            onGenerateTaglines={handleGenerateTaglines}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
                        {isLoading ? <Loader message={progressMessage} /> : generatedImages.length > 0 ? (
                            <Gallery 
                                images={generatedImages}
                                onRegenerate={handleSubmit}
                                isLoading={isLoading}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-800 rounded-lg">
                                <SparklesIcon className="w-16 h-16 text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-white">Your generated ads will appear here</h3>
                                <p className="text-gray-400 mt-1">Fill out the form to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;