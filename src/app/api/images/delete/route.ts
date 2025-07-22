import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), 'public', 'generated-images', `${imageId}.png`);
    if (existsSync(imagePath)) {
      await unlink(imagePath);
    }

    // Delete metadata file
    const metadataPath = path.join(process.cwd(), 'data', 'image-metadata', `${imageId}.json`);
    if (existsSync(metadataPath)) {
      await unlink(metadataPath);
    }

    console.log(`Image deleted successfully: ${imageId}`);

    return NextResponse.json({
      success: true,
      imageId
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
