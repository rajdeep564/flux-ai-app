# Flux AI Image Generator

A modern web application for generating images using the Flux AI API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **AI Image Generation**: Generate high-quality images using Flux Kontext Pro and Max models
- **Image-to-Image**: Upload reference images to guide the generation process
- **Local Storage**: All generated images are stored locally in your browser
- **Aspect Ratio Control**: Support for various aspect ratios (21:9 to 9:21)
- **Real-time Progress**: Live updates during image generation
- **Image Library**: View and manage all your generated images

## Getting Started

### Prerequisites

- Node.js 18+
- A Flux API key from [Black Forest Labs](https://api.bfl.ai/)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flux-ai-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

1. Navigate to the **Config** tab in the application
2. Enter your Flux API key
3. Click "Save API Key" - it will be stored securely in your browser's local storage

## Usage

### Generating Images

1. Go to the **Generate** tab
2. Enter a text prompt describing the image you want to create
3. (Optional) Upload a reference image for image-to-image generation
4. Select your preferred model:
   - **Flux Kontext Pro**: Faster generation, good quality
   - **Flux Kontext Max**: Higher quality, slower generation
5. Choose an aspect ratio from the dropdown menu
6. Click the generate button

### Managing Images

- View all generated images in the **Library** tab
- Images are automatically saved to your browser's local storage
- Each image shows the original prompt, model used, and generation date

## API Integration

The application integrates with the Flux API through Next.js API routes to avoid CORS issues:

- `POST /api/flux/generate` - Proxy for Flux image generation
- `POST /api/flux/poll` - Proxy for polling generation status

These routes internally call:
- `POST https://api.bfl.ai/v1/flux-kontext-pro` - Generate images with Flux Kontext Pro
- `POST https://api.bfl.ai/v1/flux-kontext-max` - Generate images with Flux Kontext Max

### Supported Parameters

- `prompt`: Text description of the desired image
- `input_image`: Base64 encoded reference image (optional)
- `aspect_ratio`: Image aspect ratio (21:9 to 9:21)
- `output_format`: PNG or JPEG
- `safety_tolerance`: Content moderation level (0-6)
- `prompt_upsampling`: Enhanced prompt processing

## Technical Details

### Architecture

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **UI Components**: Radix UI primitives
- **HTTP Client**: Axios for API requests
- **Storage**: Browser localStorage for images and metadata

### Key Components

- `useFluxAPI`: Custom hook for API integration and polling
- `ImageStorageService`: Local storage management for images
- `ApiKeyInput`: Secure API key configuration component

### Image Storage

Generated images are stored locally using:
- **Metadata**: Stored as JSON in localStorage
- **Image Data**: Base64 encoded images in localStorage
- **Automatic Cleanup**: No server storage required

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── api-key-input.tsx
├── hooks/              # Custom React hooks
│   └── useFluxAPI.ts
└── lib/                # Utilities and services
    ├── flux-api.ts     # API service layer
    └── utils.ts        # Helper functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

1. **API Key Not Working**: Ensure your API key is valid and has sufficient credits
2. **Generation Timeout**: Large images or complex prompts may take longer
3. **Storage Full**: Clear browser storage if you encounter storage limits
4. **CORS Errors**: This has been fixed by using Next.js API routes as proxies
5. **Network Errors**: Check your internet connection and API service status

### Error Messages

- "API key is required": Configure your API key in the Config tab
- "Generation failed": Check your internet connection and API key validity
- "Polling failed": The generation service may be temporarily unavailable

## License

This project is licensed under the MIT License.
