import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const metadataDir = path.join(process.cwd(), 'data', 'image-metadata');
    
    if (!existsSync(metadataDir)) {
      return NextResponse.json({ images: [] });
    }

    // Read all metadata files
    const files = await readdir(metadataDir);
    const metadataFiles = files.filter(file => file.endsWith('.json'));

    const images = [];
    
    for (const file of metadataFiles) {
      try {
        const filePath = path.join(metadataDir, file);
        const content = await readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        
        // Add the image URL
        const imageId = path.basename(file, '.json');
        metadata.url = `/generated-images/${imageId}.png`;
        
        images.push(metadata);
      } catch (error) {
        console.error(`Error reading metadata file ${file}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    images.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
}
