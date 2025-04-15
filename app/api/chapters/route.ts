import { NextRequest, NextResponse } from 'next/server';
import { getChapterMetadata } from '../../data/chapters';

export async function GET(request: NextRequest) {
  try {
    const bookId = request.nextUrl.searchParams.get('bookId');
    
    if (!bookId) {
      return NextResponse.json({ error: 'bookId parameter is required' }, { status: 400 });
    }
    
    console.log(`API: Fetching chapter metadata for book ID: ${bookId}`);
    
    const bookChapterMetadata = await getChapterMetadata(bookId);
    
    console.log(`API: Returning ${bookChapterMetadata.length} chapter metadata entries for book ${bookId}`);
    
    return NextResponse.json(bookChapterMetadata);
  } catch (error) {
    console.error('Error in chapters API:', error);
    return NextResponse.json({ error: 'Failed to fetch chapter metadata' }, { status: 500 });
  }
} 