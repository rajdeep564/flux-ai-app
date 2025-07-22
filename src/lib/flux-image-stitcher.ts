/**
 * Flux Image Stitcher - Based on HuggingFace Diffusers implementation
 * 
 * This implements the same image stitching technique used by Flux Kontext
 * for handling multiple input images. Images are concatenated vertically
 * and processed with proper spatial offsets.
 * 
 * Reference: https://github.com/huggingface/diffusers/pull/11880
 */

export interface FluxStitchOptions {
  maxWidth?: number;
  maxHeight?: number;
  backgroundColor?: string;
  padding?: number;
}

export class FluxImageStitcher {
  /**
   * Stitch multiple images vertically using Flux's approach
   * This matches the implementation in HuggingFace Diffusers
   */
  static async stitchImagesVertically(
    files: File[], 
    options: FluxStitchOptions = {}
  ): Promise<File> {
    if (files.length === 0) {
      throw new Error('No images provided for stitching');
    }

    if (files.length === 1) {
      return files[0]; // Return single image as-is
    }

    const {
      maxWidth = 1024,
      maxHeight = 2048,
      backgroundColor = '#000000',
      padding = 0
    } = options;

    // Load all images
    const images = await Promise.all(
      files.map(file => this.loadImageFromFile(file))
    );

    // Calculate target dimensions
    const targetWidth = Math.min(maxWidth, Math.max(...images.map(img => img.width)));
    
    // Resize images to same width while maintaining aspect ratio
    const resizedImages = await Promise.all(
      images.map(img => this.resizeImageToWidth(img, targetWidth))
    );

    // Calculate total height
    const totalHeight = resizedImages.reduce((sum, img) => sum + img.height, 0) + 
                       (padding * (resizedImages.length - 1));

    // Ensure we don't exceed max height
    const finalHeight = Math.min(maxHeight, totalHeight);
    const scaleFactor = finalHeight < totalHeight ? finalHeight / totalHeight : 1;

    // Create canvas for stitching
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = targetWidth;
    canvas.height = finalHeight;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images vertically
    let currentY = 0;
    for (const img of resizedImages) {
      const scaledHeight = img.height * scaleFactor;
      ctx.drawImage(img, 0, currentY, targetWidth, scaledHeight);
      currentY += scaledHeight + (padding * scaleFactor);
    }

    // Convert canvas to blob and then to File
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        
        const stitchedFile = new File([blob], 'flux-stitched-image.png', {
          type: 'image/png'
        });
        resolve(stitchedFile);
      }, 'image/png', 0.9);
    });
  }

  /**
   * Load image from file
   */
  private static loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      
      img.src = url;
    });
  }

  /**
   * Resize image to target width while maintaining aspect ratio
   */
  private static async resizeImageToWidth(
    img: HTMLImageElement, 
    targetWidth: number
  ): Promise<HTMLImageElement> {
    if (img.width === targetWidth) {
      return img;
    }

    const aspectRatio = img.height / img.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for resizing');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from resized canvas'));
          return;
        }
        
        const resizedImg = new Image();
        const url = URL.createObjectURL(blob);
        
        resizedImg.onload = () => {
          URL.revokeObjectURL(url);
          resolve(resizedImg);
        };
        
        resizedImg.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load resized image'));
        };
        
        resizedImg.src = url;
      }, 'image/png', 0.9);
    });
  }

  /**
   * Get preview URL for stitched images
   */
  static async getStitchPreview(files: File[]): Promise<string> {
    if (files.length === 0) return '';
    if (files.length === 1) return URL.createObjectURL(files[0]);

    try {
      const stitchedFile = await this.stitchImagesVertically(files, { 
        maxWidth: 512, 
        maxHeight: 1024 
      });
      return URL.createObjectURL(stitchedFile);
    } catch (error) {
      console.error('Error creating stitch preview:', error);
      return '';
    }
  }

  /**
   * Validate if images are suitable for Flux Kontext
   */
  static validateImagesForFlux(files: File[]): { valid: boolean; message?: string } {
    if (files.length === 0) {
      return { valid: false, message: 'No images provided' };
    }

    if (files.length > 5) {
      return { 
        valid: false, 
        message: 'Too many images. Flux Kontext works best with 2-3 images maximum.' 
      };
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      return { 
        valid: false, 
        message: `Some images are too large. Maximum size is 10MB per image.` 
      };
    }

    // Check file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      return { 
        valid: false, 
        message: 'All files must be images (PNG, JPG, etc.)' 
      };
    }

    return { valid: true };
  }
}
