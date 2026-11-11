import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100mb' }));

// Helper to concatenate multiple 24kHz 16-bit mono WAV audio buffers into a single seamless continuous WAV file
function concatenateWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  // The first buffer contains the valid WAV header
  const firstHeader = wavBuffers[0].subarray(0, 44);

  // Collect the data payloads (skipping the 44-byte header of each chunk)
  const dataChunks: Buffer[] = [];
  let totalDataLength = 0;

  for (const buf of wavBuffers) {
    if (buf.length > 44) {
      const dataPayload = buf.subarray(44);
      dataChunks.push(dataPayload);
      totalDataLength += dataPayload.length;
    }
  }

  // Create new header with updated ChunkSize and Subchunk2Size
  const newHeader = Buffer.from(firstHeader);
  // Total file size minus 8: totalDataLength + 36
  newHeader.writeUInt32LE(totalDataLength + 36, 4);
  // Subchunk2Size (data size) at byte 40
  newHeader.writeUInt32LE(totalDataLength, 40);

  return Buffer.concat([newHeader, ...dataChunks]);
}

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    apiVersion: 'v1alpha',
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Single-speaker TTS generation
app.post('/api/generate-speech', async (req, res) => {
  try {
    const {
      text,
      voice = 'Kore',
      style = 'Clear, engaging narrator',
      language = 'English',
      genrePreset,
      pace,
      pitch,
      emotion,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text content is required' });
      return;
    }

    const optionsDetails = [
      genrePreset ? `Format: ${genrePreset}` : '',
      pace && pace !== '1.0x' ? `Speaking pace: ${pace}` : '',
      pitch && pitch !== 'balanced' ? `Vocal resonance: ${pitch}` : '',
      emotion ? `Emotion: ${emotion}` : '',
    ].filter(Boolean).join('. ');

    const baseStyle = optionsDetails ? `${style}. ${optionsDetails}` : style;

    const styledInstruction = language && language !== 'English' 
      ? `${baseStyle}. Speak fluently and naturally in ${language}.`
      : baseStyle;

    const fullPrompt = styledInstruction
      ? `Speak the following text clearly in a ${styledInstruction}. Only pronounce the text naturally:\n\n${text.trim()}`
      : text.trim();

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: fullPrompt,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
    } catch (modelErr: any) {
      console.warn('Fallback to standard audio voice generation:', modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: text.trim(),
        config: {
          responseModalities: ['AUDIO'],
        },
      });
    }

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.data
    );

    if (!audioPart?.inlineData?.data) {
      res.status(500).json({
        error: 'Failed to generate speech: No audio stream returned from model.',
        details: candidate?.finishReason || 'Unknown finish reason',
      });
      return;
    }

    res.json({
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
      voice,
      textLength: text.length,
    });
  } catch (error: any) {
    console.error('Error generating single-speaker speech:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate audio',
      code: error?.status || 500,
    });
  }
});

// Multi-speaker Dialogue / Audio Series TTS generation
app.post('/api/generate-dialogue-speech', async (req, res) => {
  try {
    const { lines, speaker1, speaker2, language = 'English' } = req.body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'Dialogue lines array is required' });
      return;
    }

    const s1Name = speaker1?.name?.trim() || 'Host';
    const s1Voice = speaker1?.voice || 'Puck';
    const s1Style = speaker1?.style || 'Enthusiastic podcast host';

    const s2Name = speaker2?.name?.trim() || 'Guest';
    const s2Voice = speaker2?.voice || 'Kore';
    const s2Style = speaker2?.style || 'Thoughtful conversationalist';

    // Format dialogue script text
    const dialogueScript = lines.map((item: { speaker: string; text: string; styleCue?: string }) => {
      const isS1 = item.speaker.toLowerCase() === s1Name.toLowerCase();
      const speakerId = isS1 ? s1Name : s2Name;
      const cue = item.styleCue ? ` (${item.styleCue})` : '';
      return `${speakerId}${cue}: ${item.text.trim()}`;
    }).join('\n');

    const prompt = `Perform the following multi-speaker dialogue naturally in ${language}.
Speaker 1 "${s1Name}" tone: ${s1Style}.
Speaker 2 "${s2Name}" tone: ${s2Style}.
Pronounce natural vocal tags like <laugh>, <breath>, <gasp> and backchanneling like |yeah|, |mhm| seamlessly.

Script:
${dialogueScript}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: prompt,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: s1Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: s1Voice },
                  },
                },
                {
                  speaker: s2Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: s2Voice },
                  },
                },
              ],
            },
          },
        },
      });
    } catch (dialogueErr: any) {
      console.warn('Dialogue multiSpeakerConfig failed, attempting lite tts performance fallback:', dialogueErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: `Perform this conversational podcast dialogue with clear voice distinctions for ${s1Name} and ${s2Name} in ${language}:\n\n${dialogueScript}`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s1Voice },
            },
          },
        },
      });
    }

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.data
    );

    if (!audioPart?.inlineData?.data) {
      res.status(500).json({
        error: 'Failed to generate dialogue speech: No audio stream returned from model.',
        details: candidate?.finishReason || 'Unknown finish reason',
      });
      return;
    }

    res.json({
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
      speakers: [s1Name, s2Name],
      lineCount: lines.length,
    });
  } catch (error: any) {
    console.error('Error generating dialogue speech:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate dialogue audio',
      code: error?.status || 500,
    });
  }
});

// Longform Audio Generation Engine (Min 10 Min - Max 30 Min)
app.post('/api/generate-longform-audio', async (req, res) => {
  try {
    const {
      mode = 'solo',
      soloText,
      dialogueLines,
      speaker1,
      speaker2,
      language = 'English',
      targetMinutes = 10,
      genrePreset,
      pace,
      pitch,
      emotion,
    } = req.body;

    const optionsDetails = [
      genrePreset ? `Format: ${genrePreset}` : '',
      pace && pace !== '1.0x' ? `Speaking pace: ${pace}` : '',
      pitch && pitch !== 'balanced' ? `Resonance: ${pitch}` : '',
      emotion ? `Emotion: ${emotion}` : '',
    ].filter(Boolean).join('. ');

    const s1Name = speaker1?.name?.trim() || 'Speaker';
    const s1Voice = speaker1?.voice || 'Kore';
    const rawS1Style = speaker1?.style || 'Clear engaging speaker';
    const s1Style = optionsDetails ? `${rawS1Style}. ${optionsDetails}` : rawS1Style;

    const s2Name = speaker2?.name?.trim() || 'Co-Host';
    const s2Voice = speaker2?.voice || 'Puck';
    const rawS2Style = speaker2?.style || 'Lively conversationalist';
    const s2Style = optionsDetails ? `${rawS2Style}. ${optionsDetails}` : rawS2Style;

    const wavBuffers: Buffer[] = [];

    if (mode === 'solo') {
      const text = (soloText || '').trim();
      if (!text) {
        res.status(400).json({ error: 'Solo text is required for audio generation' });
        return;
      }

      // Break text into manageable chunks (~150-250 words each for high synthesis fidelity)
      const paragraphs = text.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
      const textChunks: string[] = [];

      for (const para of paragraphs) {
        const words = para.trim().split(/\s+/);
        if (words.length <= 250) {
          textChunks.push(para.trim());
        } else {
          // Sub-chunk long paragraph
          for (let i = 0; i < words.length; i += 200) {
            textChunks.push(words.slice(i, i + 200).join(' '));
          }
        }
      }

      // If empty or single chunk
      if (textChunks.length === 0) textChunks.push(text);

      console.log(`Processing longform solo audio (${targetMinutes}m target): ${textChunks.length} chunks`);

      // Synthesize each chunk
      for (let idx = 0; idx < textChunks.length; idx++) {
        const chunkText = textChunks[idx];
        const fullPrompt = `Speak naturally in ${language} with ${s1Style}. Only speak the text without intro:\n\n${chunkText}`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: fullPrompt,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s1Voice },
                },
              },
            },
          });
        } catch (err: any) {
          console.warn(`Fallback on chunk ${idx}:`, err?.message);
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: chunkText,
            config: { responseModalities: ['AUDIO'] },
          });
        }

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
          wavBuffers.push(Buffer.from(data, 'base64'));
        }
      }
    } else {
      // Dialogue mode
      const lines = dialogueLines || [];
      if (!Array.isArray(lines) || lines.length === 0) {
        res.status(400).json({ error: 'Dialogue lines are required' });
        return;
      }

      // Group dialogue turns into chunks of 6-8 lines
      const chunkSize = 7;
      const chunks: Array<typeof lines> = [];
      for (let i = 0; i < lines.length; i += chunkSize) {
        chunks.push(lines.slice(i, i + chunkSize));
      }

      console.log(`Processing longform dialogue (${targetMinutes}m target): ${chunks.length} chunks`);

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunkLines = chunks[cIdx];
        const script = chunkLines
          .map((item: any) => `${item.speaker}${item.styleCue ? ` (${item.styleCue})` : ''}: ${item.text}`)
          .join('\n');

        const prompt = `Perform the following multi-speaker dialogue naturally in ${language}.
${s1Name} voice: ${s1Style}.
${s2Name} voice: ${s2Style}.
Seamlessly pronounce vocal tags like <laugh>, <breath>, <gasp> and backchannelings |yeah|, |mhm|:

Script:
${script}`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: prompt,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: s1Name,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: s1Voice },
                      },
                    },
                    {
                      speaker: s2Name,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: s2Voice },
                      },
                    },
                  ],
                },
              },
            },
          });
        } catch (dErr: any) {
          console.warn(`Fallback dialogue chunk ${cIdx}:`, dErr?.message);
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: `Perform this conversational podcast dialogue with clear voice distinctions for ${s1Name} and ${s2Name} in ${language}:\n\n${script}`,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s1Voice },
                },
              },
            },
          });
        }

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
          wavBuffers.push(Buffer.from(data, 'base64'));
        }
      }
    }

    if (wavBuffers.length === 0) {
      res.status(500).json({ error: 'Failed to generate any audio chunks' });
      return;
    }

    // Seamlessly concatenate all generated WAV buffers into a single continuous file
    const combinedBuffer = concatenateWavBuffers(wavBuffers);
    const totalDataBytes = Math.max(0, combinedBuffer.length - 44);
    // 24kHz, 16-bit mono = 48,000 bytes/sec
    const durationSeconds = totalDataBytes / 48000;

    res.json({
      audioBase64: combinedBuffer.toString('base64'),
      mimeType: 'audio/wav',
      durationSeconds,
      segmentCount: wavBuffers.length,
      targetMinutes,
    });
  } catch (error: any) {
    console.error('Error generating longform audio:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate longform audio',
    });
  }
});

// AI Longform Script Expander (Crafts deep 10 to 30 min scripts)
app.post('/api/expand-script-longform', async (req, res) => {
  try {
    const {
      topic,
      targetMinutes = 15,
      format = 'dialogue',
      speaker1,
      speaker2,
      language = 'English',
      genre = 'Podcast & Audio Series',
    } = req.body;

    const s1Name = speaker1?.name || 'Alex';
    const s1Gender = speaker1?.gender || 'Male';
    const s2Name = speaker2?.name || 'Sam';
    const s2Gender = speaker2?.gender || 'Female';

    const clampedMinutes = Math.min(30, Math.max(10, Number(targetMinutes) || 15));

    const prompt = `You are an elite audio producer and series head writer.
Write a rich, comprehensive long-form audio episode designed to run for approximately ${clampedMinutes} minutes (min 10 min, max 30 min) of spoken audio.
Topic: "${topic}"
Genre: "${genre}"
Language: "${language}" (Write the entire script in ${language})
Format: ${format === 'dialogue' ? `Dynamic dialogue between ${s1Name} (${s1Gender} voice) and ${s2Name} (${s2Gender} voice)` : `Deep narrative solo audio by ${s1Name} (${s1Gender} voice)`}

Requirements for a true ${clampedMinutes}-minute experience:
1. Divide the script into clear Acts or Sections (e.g. Act 1: The Hook & Premise, Act 2: Uncovering The Clues / Deep Dive, Act 3: Heated Debate / Revelations, Act 4: Culmination & Takeaways).
2. For dialogue: Write 20 to 35 substantial, natural turns with rich storytelling, personal anecdotes, vocal bursts like <laugh>, <breath>, <gasp> and authentic backchanneling |yeah|, |mhm|.
3. For solo: Write 4 to 6 immersive multi-paragraph chapters with vivid sensory details and deliberate breath pauses <breath>.

Return a valid JSON object matching the schema.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            episodeTitle: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            targetMinutes: { type: Type.INTEGER },
            acts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actTitle: { type: Type.STRING },
                  dialogue: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING },
                        styleCue: { type: Type.STRING },
                      },
                      required: ['speaker', 'text'],
                    },
                  },
                  narration: { type: Type.STRING },
                },
                required: ['actTitle'],
              },
            },
          },
          required: ['episodeTitle', 'synopsis', 'acts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error expanding longform script:', error);
    res.status(500).json({
      error: error?.message || 'Failed to expand longform script',
    });
  }
});

// Helper for retry with backoff on temporary model load
async function generateContentWithRetry(params: any, retries = 3, delayMs = 1200): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const is503 = err?.status === 503 || err?.code === 503 || String(err?.message || '').includes('503');
      if (is503 && attempt < retries) {
        console.warn(`Gemini API 503, retrying in ${delayMs * attempt}ms (attempt ${attempt}/${retries})...`);
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

// AI Script & Series Generator using Gemini
app.post('/api/generate-series-content', async (req, res) => {
  try {
    const {
      topic,
      genre = 'Podcast',
      language = 'English',
      episodeCount = 3,
      format = 'dialogue', // 'dialogue' | 'solo'
      speaker1Name = 'Host Alex',
      speaker2Name = 'Expert Sam',
      tone = 'Engaging & cinematic',
    } = req.body;

    const prompt = `You are a world-class audio series producer and scriptwriter.
Generate an audio series titled with ${episodeCount} distinct episodes.
Topic / Concept: "${topic}"
Genre: "${genre}"
Language: "${language}" (Write all titles, summaries, and dialogue scripts in ${language})
Format: ${format === 'dialogue' ? `Two-person dialogue between "${speaker1Name}" and "${speaker2Name}"` : `Solo narration`}
Tone: "${tone}"

Return a valid JSON object matching the requested schema.
For dialogue format: Each dialogue entry in an episode script should have 'speaker' ("${speaker1Name}" or "${speaker2Name}"), 'text' (the spoken text, incorporating natural backchanneling like |yeah| or |mhm| and vocal bursts like <laugh>, <gasp>, or <breath> when fitting), and 'styleCue' (e.g. "intrigued, leans in", "laughing softly", "serious tone").
Keep episode scripts tight and impactful (around 6 to 12 lines per episode so it is engaging and renders fast).
Make the storyline or topics flow sequentially from Episode 1 to Episode ${episodeCount}.`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seriesTitle: { type: Type.STRING, description: 'Catchy, cinematic title of the series' },
            seriesDescription: { type: Type.STRING, description: 'Summary of the series premise' },
            genre: { type: Type.STRING, description: 'Genre category' },
            language: { type: Type.STRING, description: 'Language of the series' },
            suggestedSpeaker1: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                recommendedVoice: { type: Type.STRING, description: 'Puck, Charon, Kore, Fenrir, or Zephyr' },
                style: { type: Type.STRING },
              },
              required: ['name', 'role', 'recommendedVoice', 'style'],
            },
            suggestedSpeaker2: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                recommendedVoice: { type: Type.STRING, description: 'Puck, Charon, Kore, Fenrir, or Zephyr' },
                style: { type: Type.STRING },
              },
              required: ['name', 'role', 'recommendedVoice', 'style'],
            },
            episodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  episodeNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  synopsis: { type: Type.STRING },
                  soloScript: { type: Type.STRING, description: 'Narration text if solo format' },
                  dialogueScript: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING },
                        styleCue: { type: Type.STRING },
                      },
                      required: ['speaker', 'text'],
                    },
                  },
                },
                required: ['episodeNumber', 'title', 'synopsis'],
              },
            },
          },
          required: ['seriesTitle', 'seriesDescription', 'genre', 'language', 'episodes'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsedData = JSON.parse(rawText);
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating series content:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate series content',
    });
  }
});

// Translate or Adapt Script to any language
app.post('/api/translate-script', async (req, res) => {
  try {
    const { text, targetLanguage, format = 'text' } = req.body;

    if (!text || !targetLanguage) {
      res.status(400).json({ error: 'Text and targetLanguage are required' });
      return;
    }

    const prompt = `Translate and culturally localize the following audio script naturally into ${targetLanguage}.
Maintain conversational flow, emotional nuance, vocal expression cues like <laugh>, <gasp>, <breath>, and backchannelings like |mhm|, |yeah| adapted to ${targetLanguage}.
Preserve any speaker tags (e.g. "SpeakerName: ") at the beginning of lines.

Source content:
${text}`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      translatedText: response.text || '',
      targetLanguage,
    });
  } catch (error: any) {
    console.error('Error translating script:', error);
    res.status(500).json({
      error: error?.message || 'Failed to translate script',
    });
  }
});

// Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoxInfinite Audio Studio server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
