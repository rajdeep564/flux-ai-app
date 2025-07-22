import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollingUrl, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!pollingUrl) {
      return NextResponse.json(
        { error: 'Polling URL is required' },
        { status: 400 }
      );
    }

    const response = await axios.get(pollingUrl, {
      headers: {
        'x-key': apiKey,
      },
      timeout: 10000, // 10 second timeout for polling
    });

    console.log('Polling response:', {
      status: response.data.status,
      id: response.data.id,
      hasResult: !!response.data.result,
      progress: response.data.progress,
      details: response.data.details
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Flux Polling Error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'Polling request failed';
      
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
