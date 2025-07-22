import axios from 'axios';

// Types for the API
export type FluxModel = "flux-kontext-pro" | "flux-kontext-max";
export type AspectRatio = "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "9:21";

export interface FluxGenerationRequest {
  prompt: string;
  input_image?: string | null;
  seed?: number | null;
  aspect_ratio?: AspectRatio | null;
  output_format?: 'jpeg' | 'png' | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
}

export interface FluxGenerationResponse {
  id: string;
  polling_url: string;
}

export interface FluxPollResponse {
  id: string;
  status: 'pending' | 'Ready' | 'completed' | 'failed' | 'Task not found' | 'Request Moderated';
  result?: {
    prompt: string;
    seed: number;
    start_time: number;
    end_time: number;
    duration: number;
    sample: string; // URL to the generated image
  } | null;
  progress?: number | null;
  details?: {
    'Moderation Reasons'?: string[];
    [key: string]: string | string[] | number | boolean | null | undefined;
  } | string | null;
  preview?: string | null;
  error?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: FluxModel;
  aspectRatio: AspectRatio;
  timestamp: Date;
  localPath?: string;
}

class FluxAPIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(
    model: FluxModel,
    request: FluxGenerationRequest
  ): Promise<FluxGenerationResponse> {
    try {
      const response = await axios.post<FluxGenerationResponse>(
        '/api/flux/generate',
        {
          model,
          apiKey: this.apiKey,
          prompt: request.prompt,
          input_image: request.input_image,
          seed: request.seed,
          aspect_ratio: request.aspect_ratio,
          output_format: request.output_format || 'png',
          webhook_url: request.webhook_url,
          webhook_secret: request.webhook_secret,
          prompt_upsampling: request.prompt_upsampling || false,
          safety_tolerance: request.safety_tolerance || 2,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to generate image');
    }
  }

  async pollResult(pollingUrl: string): Promise<FluxPollResponse> {
    try {
      const response = await axios.post<FluxPollResponse>('/api/flux/poll', {
        pollingUrl,
        apiKey: this.apiKey,
      });

      return response.data;
    } catch (error) {
      console.error('Error polling result:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to poll result');
    }
  }

  // Convert file to base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Download image through proxy
  async downloadImage(imageUrl: string): Promise<string> {
    try {
      const response = await axios.post('/api/flux/download', {
        imageUrl
      });

      return response.data.base64;
    } catch (error) {
      console.error('Error downloading image:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to download image');
    }
  }
}

// Server-based image storage service
export class ImageStorageService {
  // Store image on server
  static async saveImage(image: GeneratedImage, base64Data: string): Promise<string> {
    try {
      const response = await axios.post('/api/images/store', {
        imageId: image.id,
        base64Data,
        metadata: {
          id: image.id,
          prompt: image.prompt,
          model: image.model,
          aspectRatio: image.aspectRatio,
          timestamp: image.timestamp.toISOString(),
        }
      });

      if (response.data.success) {
        return response.data.imageUrl;
      } else {
        throw new Error('Failed to store image on server');
      }
    } catch (error) {
      console.error('Error saving image to server:', error);
      throw error;
    }
  }

  // Get all images from server
  static async getImages(): Promise<GeneratedImage[]> {
    try {
      const response = await axios.get('/api/images/list');
      const images = response.data.images || [];

      // Convert timestamp strings back to Date objects
      return images.map((img: Omit<GeneratedImage, 'timestamp'> & { timestamp: string }) => ({
        ...img,
        timestamp: new Date(img.timestamp),
      }));
    } catch (error) {
      console.error('Error loading images from server:', error);
      return [];
    }
  }

  // Delete image from server
  static async deleteImage(imageId: string): Promise<void> {
    try {
      await axios.delete('/api/images/delete', {
        data: { imageId }
      });
    } catch (error) {
      console.error('Error deleting image from server:', error);
      throw error;
    }
  }

  // Clear all images (delete all from server)
  static async clearAll(): Promise<void> {
    try {
      const images = await this.getImages();
      const deletePromises = images.map(img => this.deleteImage(img.id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing all images:', error);
      throw error;
    }
  }

  // Legacy localStorage methods for backward compatibility and fallback
  static saveImageToLocalStorage(image: GeneratedImage): void {
    try {
      const stored = localStorage.getItem('flux-generated-images') || '[]';
      const images = JSON.parse(stored);
      const updatedImages = [image, ...images];
      localStorage.setItem('flux-generated-images', JSON.stringify(updatedImages));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getImagesFromLocalStorage(): GeneratedImage[] {
    try {
      const stored = localStorage.getItem('flux-generated-images');
      if (!stored) return [];

      const images = JSON.parse(stored) as (Omit<GeneratedImage, 'timestamp'> & { timestamp: string })[];
      return images.map((img) => ({
        ...img,
        timestamp: new Date(img.timestamp),
      }));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  static clearLocalStorage(): void {
    try {
      localStorage.removeItem('flux-generated-images');
      localStorage.removeItem('flux-image-data');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

export default FluxAPIService;
