import { NextRequest, NextResponse } from 'next/server';
import { getProductGroupPrices } from '@/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productGroupId = parseInt(id);

    if (isNaN(productGroupId)) {
      return NextResponse.json(
        { error: 'Invalid product group ID' },
        { status: 400 }
      );
    }

    const prices = await getProductGroupPrices(productGroupId);

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
