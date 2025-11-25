import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await sql`
      SELECT
        pg.normalized_brand as name,
        COUNT(DISTINCT pg.id) as model_count
      FROM product_groups pg
      WHERE pg.normalized_brand IS NOT NULL AND pg.normalized_brand != ''
      GROUP BY pg.normalized_brand
      ORDER BY model_count DESC
      LIMIT ${limit}
    `;

    const brands = result.rows.map((row, index) => ({
      id: row.name,
      name: row.name,
      modelCount: parseInt(row.model_count) || 0,
      image: null
    }));

    return NextResponse.json({
      brands,
      total: brands.length
    });
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
