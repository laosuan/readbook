import { NextRequest, NextResponse } from 'next/server';
import { getChapters, getChapterMetadata } from '../../data/chapters';

export async function GET(request: NextRequest) {
  try {
    const bookId = request.nextUrl.searchParams.get('bookId');
    const includeContent = request.nextUrl.searchParams.get('includeContent') === 'true';
    
    if (!bookId) {
      return NextResponse.json({ error: 'bookId parameter is required' }, { status: 400 });
    }
    
    console.log(`API: Fetching chapters for book ID: ${bookId} (includeContent: ${includeContent})`);
    
    let bookChapters;
    
    if (includeContent) {
      // If full content is requested, use getChapters and filter
      const allChapters = await getChapters();
      console.log(`API: Total chapters fetched: ${allChapters.length}`);
      
      // Filter chapters for the requested book
      bookChapters = allChapters.filter(chapter => chapter.bookId === bookId);
    } else {
      // For metadata only, use the optimized function
      bookChapters = await getChapterMetadata(bookId);
    }
    
    console.log(`API: Returning ${bookChapters.length} chapters for book ${bookId}`);
    
    return NextResponse.json(bookChapters);
  } catch (error) {
    console.error('Error in chapters API:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
} 