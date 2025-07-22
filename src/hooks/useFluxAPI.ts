import { useState, useCallback } from 'react';
import FluxAPIService, { 
  FluxModel, 
  AspectRatio, 
  GeneratedImage, 
  ImageStorageService,
  FluxGenerationRequest 
} from '@/lib/flux-api';

interface UseFluxAPIProps {
  apiKey: string;
}

interface GenerationOptions {
  model: FluxModel;
  prompt: string;
  aspectRatio: AspectRatio;
  inputImage?: File | null;
  seed?: number;
}

export function useFluxAPI({ apiKey }: UseFluxAPIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fluxService = new FluxAPIService(apiKey);

  const generateImage = useCallback(async (options: GenerationOptions): Promise<GeneratedImage | null> => {
    if (!apiKey) {
      setError('API key is required');
      return null;
    }

    console.log('Starting image generation with options:', options);
    setIsGenerating(true);
    setError(null);
    setGenerationProgress('Preparing request...');

    try {
      // Prepare the request
      const request: FluxGenerationRequest = {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
        output_format: 'png',
        prompt_upsampling: false,
        safety_tolerance: 2,
      };

      // Convert input image to base64 if provided
      if (options.inputImage) {
        setGenerationProgress('Processing input image...');
        request.input_image = await fluxService.fileToBase64(options.inputImage);
      }

      if (options.seed) {
        request.seed = options.seed;
      }

      // Start generation
      setGenerationProgress('Starting image generation...');
      const response = await fluxService.generateImage(options.model, request);

      // Poll for results
      setGenerationProgress('Generating image...');
      const result = await pollForResult(response.polling_url);

      if ((result.status === 'Ready' || result.status === 'completed') && result.result?.sample) {
        setGenerationProgress('Saving image...');

        // Create the generated image object
        const generatedImage: GeneratedImage = {
          id: result.id,
          url: '', // Will be set from local storage
          prompt: options.prompt,
          model: options.model,
          aspectRatio: options.aspectRatio,
          timestamp: new Date(),
        };

        // Download and save image to server
        let imageData = result.result.sample;

        // If the result is a URL, download the image through our proxy
        if (imageData.startsWith('http')) {
          setGenerationProgress('Downloading image...');
          try {
            imageData = await fluxService.downloadImage(imageData);
          } catch (downloadError) {
            console.error('Error downloading image:', downloadError);
            // Fallback to using the URL directly
            generatedImage.url = imageData;
            // Try to save to localStorage as fallback
            ImageStorageService.saveImageToLocalStorage(generatedImage);
            setGenerationProgress('');
            setIsGenerating(false);
            return generatedImage;
          }
        }

        // Save to server storage
        setGenerationProgress('Saving image to server...');
        try {
          const serverImageUrl = await ImageStorageService.saveImage(generatedImage, imageData);
          generatedImage.url = serverImageUrl;
        } catch (saveError) {
          console.error('Error saving to server, falling back to localStorage:', saveError);
          // Fallback to localStorage if server storage fails
          try {
            ImageStorageService.saveImageToLocalStorage(generatedImage);
            // Create a data URL for immediate display
            generatedImage.url = `data:image/png;base64,${imageData}`;
          } catch (localError) {
            console.error('Error saving to localStorage:', localError);
            // Last resort: use the original URL
            generatedImage.url = result.result.sample;
          }
        }

        setGenerationProgress('');
        setIsGenerating(false);
        return generatedImage;
      } else if (result.status === 'Request Moderated') {
        // Handle moderation response
        console.log('Moderation details:', result.details);

        const moderationReasons = typeof result.details === 'object' && result.details && 'Moderation Reasons' in result.details
          ? result.details['Moderation Reasons'] || ['Content moderated']
          : ['Content moderated'];

        const reasonsText = moderationReasons.join(', ');

        throw new Error(`Request was moderated: ${reasonsText}. Please try a different prompt that doesn't include copyrighted material or inappropriate content.`);
      } else if (result.status === 'failed' || result.status === 'Task not found') {
        throw new Error(result.error || `Image generation failed with status: ${result.status}`);
      } else {
        throw new Error(`Unexpected result status: ${result.status}`);
      }
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsGenerating(false);
      setGenerationProgress('');
      return null;
    }
  }, [apiKey, fluxService]);

  const pollForResult = async (pollingUrl: string, maxAttempts = 60, interval = 2000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await fluxService.pollResult(pollingUrl);

        console.log(`Polling attempt ${attempt + 1}: Status = ${result.status}`, result);

        // Check for completion statuses
        if (result.status === 'Ready' || result.status === 'completed' ||
            result.status === 'failed' || result.status === 'Task not found' ||
            result.status === 'Request Moderated') {
          console.log('Polling completed with status:', result.status);
          return result;
        }

        // Update progress with more detailed information
        const progressText = result.progress
          ? `Generating image... ${Math.round(result.progress * 100)}% (${attempt + 1}/${maxAttempts})`
          : `Generating image... (${attempt + 1}/${maxAttempts})`;

        setGenerationProgress(progressText);

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Polling error:', error);
        if (attempt === maxAttempts - 1) {
          throw new Error('Polling failed after maximum attempts');
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Generation timed out');
  };



  const getStoredImages = useCallback(async (): Promise<GeneratedImage[]> => {
    try {
      // Try to get images from server first
      const serverImages = await ImageStorageService.getImages();
      if (serverImages.length > 0) {
        return serverImages;
      }

      // Fallback to localStorage if server has no images
      const localImages = ImageStorageService.getImagesFromLocalStorage();
      return localImages;
    } catch (error) {
      console.error('Error loading images from server, falling back to localStorage:', error);
      // Fallback to localStorage if server fails
      return ImageStorageService.getImagesFromLocalStorage();
    }
  }, []);

  const clearAllImages = useCallback(async () => {
    try {
      // Clear from server
      await ImageStorageService.clearAll();
      // Also clear localStorage as backup
      ImageStorageService.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing images from server:', error);
      // Fallback to clearing localStorage only
      ImageStorageService.clearLocalStorage();
    }
  }, []);

  return {
    generateImage,
    isGenerating,
    generationProgress,
    error,
    getStoredImages,
    clearAllImages,
  };
}
