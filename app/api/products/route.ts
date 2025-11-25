import { NextRequest, NextResponse } from 'next/server';
import { searchProductGroups } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('search') || undefined;
    const categoryId = searchParams.get('category');
    const brand = searchParams.get('brand') || undefined;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const limit = searchParams.get('limit');

    const products = await searchProductGroups(
      query,
      categoryId ? parseInt(categoryId) : undefined,
      brand,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined,
      limit ? parseInt(limit) : 50
    );

    // Transform to match expected format
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand || '',
      model: p.model || '',
      minPrice: p.min_price || 0,
      maxPrice: p.max_price || 0,
      image: p.image_url || '/placeholder-guitar.jpg',
      storeCount: p.store_count || 0,
      categoryName: p.category_name || ''
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
