import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@andresaya/edge-tts';

export async function POST(request: NextRequest) {
  console.log('TTS API route called');
  
  try {
    // Parse the text from the request body
    const { text, voice = 'en-US-AriaNeural' } = await request.json();
    console.log('Request received with text:', text && text.substring(0, 50) + '...');
    
    if (!text) {
      console.log('No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    console.log('Initializing Edge TTS...');
    // Initialize Edge TTS
    const tts = new EdgeTTS();
    
    console.log('Synthesizing speech with the updated implementation...');
    // First attempt - try synthesizing with default options
    try {
      console.log('Starting speech synthesis with voice:', voice);
      
      // Synthesize the text to speech
      await tts.synthesize(text, voice, {
        rate: '0%',  // neutral rate
        volume: '0%', // neutral volume
        pitch: '0Hz'  // neutral pitch - must be in range -100Hz to 100Hz
      });
      
      // Get the audio data as base64
      console.log('Getting audio as base64...');
      const base64Audio = await tts.toBase64();
      
      // Log the actual result for debugging
      console.log('Base64 audio received, length:', base64Audio ? base64Audio.length : 0);
      
      if (!base64Audio || base64Audio.length === 0) {
        console.error('Empty base64 audio received');
        throw new Error('No audio data generated');
      }
      
      console.log('Successfully generated base64 audio, length:', base64Audio.length);
      
      // Return the audio data
      return NextResponse.json({
        audio: base64Audio,
        format: 'mp3',
        text: text
      });
    } catch (firstError) {
      console.error('First TTS attempt failed:', firstError);
      
      // If the first attempt fails, try with a different voice and approach
      try {
        console.log('Trying with alternative voice: en-US-GuyNeural');
        
        // Create a new instance
        const altTts = new EdgeTTS();
        
        // Try with a different voice and ensure parameters are correct
        await altTts.synthesize(text, 'en-US-GuyNeural', {
          rate: '0%',  // correct format for rate
          volume: '0%', // correct format for volume
          pitch: '0Hz'  // correct format for pitch
        });
        
        // Get the audio as base64
        console.log('Getting audio as base64 with alternative voice...');
        const altBase64 = await altTts.toBase64();
        console.log('Alternative voice base64 length:', altBase64 ? altBase64.length : 0);
        
        if (!altBase64 || altBase64.length === 0) {
          console.error('Alternative voice also failed to generate audio');
          
          // Last resort - try with a fixed voice that we know works
          console.log('Trying final fallback with en-US-EricNeural...');
          const finalTts = new EdgeTTS();
          await finalTts.synthesize(text, 'en-US-EricNeural', {
            rate: '0%',
            volume: '0%',
            pitch: '0Hz'
          });
          
          const finalBase64 = await finalTts.toBase64();
          console.log('Final fallback base64 length:', finalBase64 ? finalBase64.length : 0);
          
          if (!finalBase64 || finalBase64.length === 0) {
            throw new Error('All voice options failed to generate audio');
          }
          
          console.log('Successfully generated audio with final fallback voice');
          return NextResponse.json({
            audio: finalBase64,
            format: 'mp3',
            text: text,
            info: 'Used final fallback voice'
          });
        }
        
        console.log('Successfully generated audio with alternative voice');
        return NextResponse.json({
          audio: altBase64,
          format: 'mp3',
          text: text,
          info: 'Used alternative voice'
        });
      } catch (altError) {
        console.error('All alternative voice attempts failed:', altError);
        throw new Error('All TTS attempts failed');
      }
    }
    
  } catch (error) {
    console.error('TTS API error:', error);
    // More detailed error message for debugging
    const errorMessage = error instanceof Error ? 
      `Failed to synthesize speech: ${error.message}` : 
      'Failed to synthesize speech: unknown error';
    
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
