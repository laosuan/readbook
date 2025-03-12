import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@andresaya/edge-tts';

// 定义错误类型
interface TTSError {
  message: string;
  stack?: string;
  time: string;
}

// 常量定义
const MAX_CHUNK_LENGTH = 500; // 最大文本块长度，超过此长度的文本会被分割
const TTS_TIMEOUT = 10000; // 10 seconds timeout for TTS operations

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
 * 为单个文本块生成语音，带有超时处理
 * @param text 要合成的文本
 * @param voice 语音选项
 * @returns Base64编码的音频
 */
async function synthesizeTextChunk(text: string, voice: string): Promise<string> {
  console.log('Synthesizing chunk with text length:', text.length);
  console.log('Chunk text preview:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  
  // Promise with timeout mechanism
  return Promise.race([
    (async () => {
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
    })(),
    new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('TTS synthesis timeout')), TTS_TIMEOUT)
    )
  ]);
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
    
    const { voice = 'en-US-AriaNeural' } = requestBody;
    let { text } = requestBody;
    text = text.replace(/\n/g, ' ');
    console.log('Request received with text:', text && text.substring(0, 50) + '...');
    
    if (!text) {
      console.log('No text provided');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    // 拆分文本为小块 - Always split into smaller chunks to prevent timeouts
    const textChunks = splitTextIntoChunks(text);
    console.log(`Split text into ${textChunks.length} chunks for processing`);
    
    try {
      // 无论文本长度如何，总是用并行处理方式来避免超时
      console.log(`Processing ${textChunks.length} chunks in parallel`);
      
      // 并行处理所有文本块，但限制并发数量防止过载
      const concurrencyLimit = 3; // 最多同时处理3个块
      const audioChunks: string[] = [];
      
      // 分批处理文本块
      for (let i = 0; i < textChunks.length; i += concurrencyLimit) {
        const batch = textChunks.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(chunk => synthesizeTextChunk(chunk, voice));
        const batchResults = await Promise.all(batchPromises);
        audioChunks.push(...batchResults);
        console.log(`Processed batch ${i/concurrencyLimit + 1} of ${Math.ceil(textChunks.length/concurrencyLimit)}`);
      }
      
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
      console.error('Error processing chunks:', error);
      
      // 尝试使用备用语音和更小的块处理
      console.log('Attempting to process with fallback voice and smaller chunks');
      try {
        // const fallbackVoice = 'en-US-GuyNeural';
        const fallbackVoice = 'en-US-AvaMultilingualNeural' ;
        // 进一步分割文本为更小的块
        const smallerChunks = textChunks.flatMap(chunk => 
          chunk.length > 250 ? splitTextIntoChunks(chunk) : [chunk]
        );
        
        console.log(`Using ${smallerChunks.length} smaller chunks with fallback voice`);
        
        // 分批处理文本块
        const concurrencyLimit = 2; // 降低并发数
        const fallbackAudioChunks: string[] = [];
        
        for (let i = 0; i < smallerChunks.length; i += concurrencyLimit) {
          const batch = smallerChunks.slice(i, i + concurrencyLimit);
          const batchPromises = batch.map(chunk => synthesizeTextChunk(chunk, fallbackVoice));
          const batchResults = await Promise.all(batchPromises);
          fallbackAudioChunks.push(...batchResults);
        }
        
        const fallbackCombinedAudio = await combineAudioChunks(fallbackAudioChunks);
        
        return NextResponse.json({
          audio: fallbackCombinedAudio,
          format: 'mp3',
          text: text,
          info: `Processed in ${smallerChunks.length} chunks with fallback voice`
        });
      } catch (fallbackError) {
        console.error('Fallback process also failed:', fallbackError);
        throw new Error('Failed to process text with all options');
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
