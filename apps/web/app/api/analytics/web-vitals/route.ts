import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for receiving Web Vitals metrics
 *
 * This endpoint receives performance metrics from the client
 * and can log them or store them for analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }

    // In production, you could:
    // - Send to analytics service (Google Analytics, Datadog, etc.)
    // - Store in database for historical analysis
    // - Trigger alerts if metrics exceed thresholds

    // For now, just acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid metric data' },
      { status: 400 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
