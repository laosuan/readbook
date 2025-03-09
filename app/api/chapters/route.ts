import { NextRequest, NextResponse } from 'next/server';
import { getChapters } from '../../data/chapters';

export async function GET(request: NextRequest) {
  try {
    const bookId = request.nextUrl.searchParams.get('bookId');
    
    if (!bookId) {
      return NextResponse.json({ error: 'bookId parameter is required' }, { status: 400 });
    }
    
    console.log(`API: Fetching chapters for book ID: ${bookId}`);
    
    // Get all chapters
    const allChapters = await getChapters();
    console.log(`API: Total chapters fetched: ${allChapters.length}`);
    
    // Filter chapters for the requested book
    const bookChapters = allChapters.filter(chapter => chapter.bookId === bookId);
    console.log(`API: Filtered chapters for book ${bookId}: ${bookChapters.length}`);
    
    return NextResponse.json(bookChapters);
  } catch (error) {
    console.error('Error in chapters API:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
} 