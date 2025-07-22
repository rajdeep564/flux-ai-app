import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, base64Data, metadata } = body;

    if (!imageId || !base64Data) {
      return NextResponse.json(
        { error: 'Image ID and base64 data are required' },
        { status: 400 }
      );
    }

    // Create images directory if it doesn't exist
    const imagesDir = path.join(process.cwd(), 'public', 'generated-images');
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // Create metadata directory if it doesn't exist
    const metadataDir = path.join(process.cwd(), 'data', 'image-metadata');
    if (!existsSync(metadataDir)) {
      await mkdir(metadataDir, { recursive: true });
    }

    // Convert base64 to buffer and save as PNG file
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imagePath = path.join(imagesDir, `${imageId}.png`);
    await writeFile(imagePath, imageBuffer);

    // Save metadata as JSON file
    if (metadata) {
      const metadataPath = path.join(metadataDir, `${imageId}.json`);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    // Return the public URL for the image
    const imageUrl = `/generated-images/${imageId}.png`;

    console.log(`Image stored successfully: ${imageId}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      imageId
    });
  } catch (error) {
    console.error('Error storing image:', error);
    
    return NextResponse.json(
      { error: 'Failed to store image' },
      { status: 500 }
    );
  }
}
