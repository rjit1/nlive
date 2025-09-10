
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { AdConfig } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeImage = async (file: File, context: 'model' | 'product'): Promise<string> => {
    const imagePart = await fileToGenerativePart(file);
    const prompt = context === 'model' 
        ? "Analyze this model image in high detail. Describe their exact facial features (face shape, skin tone, eyes, expression), hair, and body type. This description will be used to ensure perfect likeness in generated images."
        : "Analyze this product photo. Describe the clothing item's type, exact color, fabric texture, fit (e.g., oversized, slim), and any prints or details. This description will be used to perfectly replicate the item.";
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
};

export const generateTaglines = async (productDescription: string): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Based on this product description: "${productDescription}", generate 3-5 professional, catchy e-commerce taglines. Range from bold one-word statements to motivational phrases.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    taglines: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const parsed = JSON.parse(response.text);
    return parsed.taglines || [];
};

export const generateAdPrompts = async (
    modelDesc: string,
    productDesc: string,
    config: AdConfig
): Promise<string[]> => {
    const systemPrompt = `You are a professional e-commerce ad designer. Your task is to generate 8 detailed prompts for photorealistic ad images for a clothing brand.

CRITICAL REQUIREMENTS:
- **STRICT OUTPUT CANVAS**: All images must be in portrait orientation with a 4:5 aspect ratio at 1080x1350 pixels. Do not use borders, padding, or letterboxing. Fill the entire canvas. Frame subjects appropriately so nothing important is cut off by the 4:5 crop.
- **Product and Model Integrity**: Each prompt MUST feature the EXACT SAME product from the description composited onto the model. Preserve all product details (texture, fit, design) and the model's exact facial features and identity for perfect likeness.
- **Logo Placement**: If the user selects 'Brand Logo Overlay' and provides a logo image, you MUST incorporate that exact logo onto the final ad image in a professional and aesthetically pleasing way.

- **MANDATORY PRODUCT COLOR SWATCHES**: This is the most important instruction. Every generated ad image *must* contain a dedicated section displaying color variations of the product.
  - **Task**: For each color selected by the user, you must generate a photorealistic swatch of the product in that new color.
  - **Base Image**: Use the isolated product photograph as the source for these swatches.
  - **Recoloring Process**: This is not a simple color fill. You must digitally re-color the product while meticulously preserving 100% of its original details: fabric texture, weave, shadows, highlights, and seams. The result should look like an authentic photograph of the product manufactured in the new color.
  - **Presentation**: Display these recolored swatches clearly within the ad. For example, in a clean row at the bottom, or in a graphic inset. Do NOT show the model in these swatches; they must be of the product alone.
  - **Labeling**: Each swatch must be clearly labeled with its color name (e.g., "Red", "Black").
  - **Consistency**: Failure to include this detailed and accurate color swatch section is a failure to follow instructions. This is a non-negotiable element of the final image.

- **Layouts and Elements**: Create layouts matching user-selected views. Vary backgrounds, lighting, and poses. Integrate the tagline and any additional elements (like size charts) seamlessly and professionally.
- **Quality**: Aim for hyper-realistic, professional, and impressive compositions that are clean, attractive, and drive conversions. Use photography and design terms to specify high quality (e.g., 'shot on Canon EOS R5, 85mm lens, f/2.8').
- **Output**: The final output must be a JSON object containing a list of these detailed prompts.
`;
    const userPrompt = `
        Model Description: ${modelDesc}
        Product Description: ${productDesc}
        Brand Name: ${config.brandName || 'Not specified'}
        Tagline: "${config.taglineOption === 'user' ? config.userTagline : config.aiTagline}"
        Color Variations for Swatches (recolor the isolated product photo to these colors): ${config.colors.join(', ')}
        Requested Layouts/Views: ${config.layouts.join(', ')}
        Additional Elements: ${config.additionalElements.join(', ')}
        \nStrictly render all images as portrait 4:5 at 1080x1350 px. No borders or letterboxing. Fill the full canvas.\n
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const parsed = JSON.parse(response.text);
    return parsed.prompts || [];
};

export const generateAdImage = async (
    modelFile: File,
    productFile: File,
    prompt: string,
    logoFile?: File,
): Promise<string> => {
    const modelPart = await fileToGenerativePart(modelFile);
    const productPart = await fileToGenerativePart(productFile);
    const textPart = { text: prompt };

    const parts = [modelPart, productPart, textPart];
    if (logoFile) {
        const logoPart = await fileToGenerativePart(logoFile);
        parts.push(logoPart);
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
          ...parts,
          // Hard-constraint for size/orientation understood by 2.5 image preview models
          { text: 'Render strictly as portrait 4:5 aspect ratio at 1080x1350 pixels. No borders, no letterboxing. Fill the full canvas.' }
        ] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    
    throw new Error("Image generation failed, no image data received.");
};
