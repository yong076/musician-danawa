import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category');

    const products = await searchProducts(
      query,
      categoryId ? parseInt(categoryId) : undefined
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
