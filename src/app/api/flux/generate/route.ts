import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, apiKey, ...fluxPayload } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!model || !['flux-kontext-pro', 'flux-kontext-max'].includes(model)) {
      return NextResponse.json(
        { error: 'Valid model is required (flux-kontext-pro or flux-kontext-max)' },
        { status: 400 }
      );
    }

    const endpoint = model === 'flux-kontext-pro' 
      ? 'https://api.bfl.ai/v1/flux-kontext-pro'
      : 'https://api.bfl.ai/v1/flux-kontext-max';

    console.log('Making request to:', endpoint);
    console.log('Payload:', { ...fluxPayload, prompt: fluxPayload.prompt?.substring(0, 50) + '...' });

    const response = await axios.post(endpoint, fluxPayload, {
      headers: {
        'x-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log('Generation response:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Flux API Error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'API request failed';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
