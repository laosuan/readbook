import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@andresaya/edge-tts';

// 定义错误类型
interface TTSError {
  message: string;
  stack?: string;
  time: string;
}

// 常量定义
const MAX_CHUNK_LENGTH = 800; // 最大文本块长度，超过此长度的文本会被分割

// 记录所有 Edge TTS 的调用情况，用于调试
let apiCallCount = 0;
let lastError: TTSError | null = null;

/**
 * 将长文本拆分成小块
 * @param text 需要拆分的文本
 * @returns 拆分后的文本块数组
 */
function splitTextIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_LENGTH, text.length);
    
    // 尝试在句子边界处分割，使拆分更自然
    if (end < text.length) {
      const sentenceEndings = ['. ', '! ', '? ', '; ']; // 可能的句子结尾
      let bestBreakPoint = end;
      
      // 从最大长度向后查找一个好的句子结尾
      for (let i = end; i > Math.max(start + 100, end - 100); i--) { // 不要回溯超过100个字符
        const twoChars = text.substring(i - 1, i + 1);
        if (sentenceEndings.some(ending => ending === twoChars)) {
          bestBreakPoint = i + 1; // 包括句号后的空格
          break;
        }
      }
      
      // 如果没有找到好的句子结尾，尝试查找空格
      if (bestBreakPoint === end) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + 100) { // 确保不会创建很小的块
          bestBreakPoint = lastSpace + 1; // 包括空格
        }
      }
      
      end = bestBreakPoint;
    }
    
    chunks.push(text.substring(start, end));
    start = end;
  }
  
  console.log('Split text into chunks:', chunks.length, 'chunks');
  return chunks;
}

/**
 * 合并多个Base64编码的音频
 * @param audioChunks Base64编码的音频数组
 * @returns 合并后的Base64编码音频
 */
async function combineAudioChunks(audioChunks: string[]): Promise<string> {
  if (audioChunks.length === 0) return '';
  if (audioChunks.length === 1) return audioChunks[0];
  
  try {
    // 将所有Base64字符串转换为Buffer
    const buffers = audioChunks.map(chunk => Buffer.from(chunk, 'base64'));
    
    // 将所有Buffer合并为一个
    const combinedBuffer = Buffer.concat(buffers);
    
    // 将合并后的Buffer转换回Base64字符串
    return combinedBuffer.toString('base64');
  } catch (error) {
    console.error('Error combining audio chunks:', error);
    throw new Error('Failed to combine audio chunks');
  }
}

/**
 * 为单个文本块生成语音
 * @param text 要合成的文本
 * @param voice 语音选项
 * @returns Base64编码的音频
 */
async function synthesizeTextChunk(text: string, voice: string): Promise<string> {
  console.log('Synthesizing chunk with text length:', text.length);
  console.log('Chunk text preview:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  
  // 初始化Edge TTS
  const tts = new EdgeTTS();
  
  try {
    // 合成语音
    await tts.synthesize(text, voice, {
      rate: '0%',  // 中性速率
      volume: '0%', // 中性音量
      pitch: '0Hz'  // 中性音调 - 必须在 -100Hz 到 100Hz 范围内
    });
    
    // 获取Base64编码的音频
    const base64Audio = await tts.toBase64();
    
    if (!base64Audio || base64Audio.length === 0) {
      throw new Error('No audio data generated for chunk');
    }
    
    console.log('Successfully generated base64 audio for chunk, length:', base64Audio.length);
    return base64Audio;
  } catch (error) {
    console.error('Failed to synthesize chunk:', error);
    throw error;
  }
}

// For debugging - expose a GET endpoint to get the last error
export async function GET() {
  return NextResponse.json({
    status: 'TTS API diagnostic endpoint',
    calls: apiCallCount,
    lastError: lastError ? {
      message: lastError.message,
      stack: lastError.stack,
      time: lastError.time
    } : null
  });
}

export async function POST(request: NextRequest) {
  apiCallCount++;
  console.log(`TTS API route called (call #${apiCallCount})`, new Date().toISOString());
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // 解析请求体
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    var { text, voice = 'en-US-AriaNeural' } = requestBody;
    text = text.replace(/\n/g, ' ');
    console.log('Request received with text:', text && text.substring(0, 50) + '...');
    
    if (!text) {
      console.log('No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    // 拆分文本为小块
    const textChunks = splitTextIntoChunks(text);
    console.log(`Split text into ${textChunks.length} chunks for processing`);
    
    if (textChunks.length === 1) {
      // 单块文本处理 - 使用现有逻辑
      console.log('Text is small enough for single chunk processing');
      
      console.log('Initializing Edge TTS...', new Date().toISOString());
      // Initialize Edge TTS
      console.log('Creating new EdgeTTS instance');
      const tts = new EdgeTTS();
      console.log('EdgeTTS instance created successfully');
      
      console.log('Synthesizing speech with the updated implementation...');
      // First attempt - try synthesizing with default options
      try {
        console.log(`Call #${apiCallCount} - Starting synthesis`);
        console.log('Starting speech synthesis with voice:', voice);
        
        // Synthesize the text to speech
        console.log('Calling tts.synthesize with text:', text);
        console.log('Voice:', voice);
        try {
          await tts.synthesize(text, voice, {
            rate: '0%',  // neutral rate
            volume: '0%', // neutral volume
            pitch: '0Hz'  // neutral pitch - must be in range -100Hz to 100Hz
          });
          console.log('Speech synthesis completed successfully');
        } catch (synthError) {
          console.error('Error during speech synthesis:', synthError);
          throw synthError;
        }
        
        // Get the audio data as base64
        console.log('Getting audio as base64...', new Date().toISOString());
        const base64Audio = await tts.toBase64();
        
        // Log the actual result for debugging
        console.log('Base64 audio received, length:', base64Audio ? base64Audio.length : 0);
        
        if (!base64Audio || base64Audio.length === 0) {
          console.error('Empty base64 audio received');
          const noAudioError = new Error('No audio data generated');
          lastError = {
            message: noAudioError.message,
            stack: noAudioError.stack,
            time: new Date().toISOString()
          };
          throw noAudioError;
        }
        
        console.log('Successfully generated base64 audio, length:', base64Audio.length);
        
        // Return the audio data
        console.log('Returning successful response with audio data');
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
    } else {
      // 多块文本处理 - 需要并行处理每个块并合并结果
      console.log(`Processing ${textChunks.length} chunks in parallel`);
      
      try {
        // 并行处理所有文本块
        const audioChunksPromises = textChunks.map(chunk => synthesizeTextChunk(chunk, voice));
        const audioChunks = await Promise.all(audioChunksPromises);
        
        console.log(`Successfully synthesized ${audioChunks.length} audio chunks`);
        
        // 合并所有音频块
        const combinedAudio = await combineAudioChunks(audioChunks);
        console.log('Combined audio length:', combinedAudio.length);
        
        // 返回合并后的音频数据
        return NextResponse.json({
          audio: combinedAudio,
          format: 'mp3',
          text: text,
          info: `Processed in ${textChunks.length} chunks`
        });
      } catch (error) {
        console.error('Error processing multiple chunks:', error);
        
        // 尝试使用备用语音
        console.log('Attempting to process chunks with fallback voice');
        try {
          const fallbackVoice = 'en-US-GuyNeural';
          const fallbackAudioChunksPromises = textChunks.map(chunk => synthesizeTextChunk(chunk, fallbackVoice));
          const fallbackAudioChunks = await Promise.all(fallbackAudioChunksPromises);
          
          const fallbackCombinedAudio = await combineAudioChunks(fallbackAudioChunks);
          
          return NextResponse.json({
            audio: fallbackCombinedAudio,
            format: 'mp3',
            text: text,
            info: `Processed in ${textChunks.length} chunks with fallback voice`
          });
        } catch (fallbackError) {
          console.error('Fallback voice also failed:', fallbackError);
          throw new Error('Failed to process text chunks with all voice options');
        }
      }
    }
    
  } catch (error) {
    console.error(`TTS API error (call #${apiCallCount}):`, error);
    // More detailed error message for debugging
    const errorMessage = error instanceof Error ? 
      `Failed to synthesize speech: ${error.message}` : 
      'Failed to synthesize speech: unknown error';
    
    console.error(errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    lastError = {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      time: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      error: errorMessage, 
      callNumber: apiCallCount,
      time: new Date().toISOString()
    }, { status: 500 });
  }
}
