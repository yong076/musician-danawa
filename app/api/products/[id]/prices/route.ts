import { NextRequest, NextResponse } from 'next/server';
import { getProductPrices } from '@/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const prices = await getProductPrices(productId);

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
