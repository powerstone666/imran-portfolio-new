import * as fs from "fs/promises";
import * as path from "path";

const QWEN_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEFAULT_AUDIO_FORMAT = "mp3";
const DEFAULT_USER_TEXT = "Please respond with voice only.";
const PCM16_SAMPLE_RATE = 24000;
const PCM16_CHANNEL_COUNT = 1;
const PCM16_BITS_PER_SAMPLE = 16;
const AUDIO_MIME_BY_FORMAT: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  opus: "audio/opus",
  flac: "audio/flac",
};

type StreamChunk = {
  choices?: Array<{
    delta?: {
      audio?: {
        data?: string;
        format?: string;
      };
    };
  }>;
};

function normalizeAudioInput(audioInput: string): { data: string; format: string } {
  if (audioInput.startsWith("http://") || audioInput.startsWith("https://")) {
    return { data: audioInput, format: DEFAULT_AUDIO_FORMAT };
  }

  const dataUrlMatch = audioInput.match(/^data:audio\/([a-zA-Z0-9.+-]+)(?:;[^,]*)?;base64,(.+)$/);
  if (dataUrlMatch) {
    const [, rawFormat] = dataUrlMatch;
    const format = rawFormat.toLowerCase().replace("x-", "");
    return { data: audioInput, format };
  }

  if (audioInput.startsWith("data:;base64,")) {
    return { data: audioInput, format: DEFAULT_AUDIO_FORMAT };
  }

  // Convert raw base64 to a Data URL as required by the Qwen compatible API.
  return {
    data: `data:;base64,${audioInput}`,
    format: DEFAULT_AUDIO_FORMAT,
  };
}

function parseSseDataLines(chunk: string): string[] {
  return chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

function isWavBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  );
}

function isMp3Buffer(buffer: Buffer): boolean {
  if (buffer.length < 3) {
    return false;
  }

  const hasId3Header = buffer.toString("ascii", 0, 3) === "ID3";
  if (hasId3Header) {
    return true;
  }

  // MPEG audio frame sync: 11 bits set (0xFFE) at the start of a frame.
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function detectContainerFormat(buffer: Buffer): string | null {
  if (isWavBuffer(buffer)) {
    return "wav";
  }
  if (isMp3Buffer(buffer)) {
    return "mp3";
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "fLaC") {
    return "flac";
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "OggS") {
    return "opus";
  }
  return null;
}

function convertPcm16LeToWavBuffer(
  pcmData: Buffer,
  sampleRate: number = PCM16_SAMPLE_RATE,
  channels: number = PCM16_CHANNEL_COUNT,
): Buffer {
  const byteRate = sampleRate * channels * (PCM16_BITS_PER_SAMPLE / 8);
  const blockAlign = channels * (PCM16_BITS_PER_SAMPLE / 8);
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0, "ascii");
  wavHeader.writeUInt32LE(36 + pcmData.length, 4);
  wavHeader.write("WAVE", 8, "ascii");
  wavHeader.write("fmt ", 12, "ascii");
  wavHeader.writeUInt32LE(16, 16); // PCM chunk size
  wavHeader.writeUInt16LE(1, 20); // PCM format tag
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(PCM16_BITS_PER_SAMPLE, 34);
  wavHeader.write("data", 36, "ascii");
  wavHeader.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([wavHeader, pcmData]);
}

function finalizeAudioForBrowser(audioData: Buffer, declaredFormat: string): { audioData: Buffer; format: string } {
  const normalizedDeclaredFormat = declaredFormat.toLowerCase();
  const detectedFormat = detectContainerFormat(audioData);
  if (detectedFormat) {
    return { audioData, format: detectedFormat };
  }

  const isLikelyRawPcm =
    normalizedDeclaredFormat.includes("pcm") ||
    normalizedDeclaredFormat === "wav" ||
    normalizedDeclaredFormat === "mp3";

  if (isLikelyRawPcm && audioData.length > 0 && audioData.length % 2 === 0) {
    const wavData = convertPcm16LeToWavBuffer(audioData);
    return { audioData: wavData, format: "wav" };
  }

  return { audioData, format: normalizedDeclaredFormat || DEFAULT_AUDIO_FORMAT };
}

async function collectAudioFromStream(response: Response): Promise<{ audioData: Buffer; format: string }> {
  if (!response.body) {
    throw new Error("Qwen stream response did not include a body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const audioChunks: Buffer[] = [];
  let buffer = "";
  let format = DEFAULT_AUDIO_FORMAT;
  let receivedDone = false;

  const processEvent = (event: string) => {
    for (const dataLine of parseSseDataLines(event)) {
      if (dataLine === "[DONE]") {
        receivedDone = true;
        return;
      }

      try {
        const json = JSON.parse(dataLine) as StreamChunk;
        const deltaAudio = json.choices?.[0]?.delta?.audio;
        if (deltaAudio?.data) {
          audioChunks.push(Buffer.from(deltaAudio.data, "base64"));
        }
        if (deltaAudio?.format) {
          format = deltaAudio.format.toLowerCase();
        }
      } catch {
        // Ignore non-JSON keepalive lines.
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      if (buffer.trim()) {
        processEvent(buffer);
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      processEvent(event);
      if (receivedDone) {
        return { audioData: Buffer.concat(audioChunks), format };
      }
    }
  }

  if (audioChunks.length === 0) {
    throw new Error("Qwen stream completed without audio chunks.");
  }

  return { audioData: Buffer.concat(audioChunks), format };
}

export async function askQwen(message?: string, audioUrl?: string, audioBase64?: string) {
  const apiDir = path.join(process.cwd(), "app", "api", "genai");
  const instructionsPath = path.join(apiDir, "system-instructions.txt");
  const resumePath = path.join(apiDir, "resume.txt");

  const [instructions, resume] = await Promise.all([
    fs.readFile(instructionsPath, "utf-8").catch(() => ""),
    fs.readFile(resumePath, "utf-8").catch(() => ""),
  ]);

  const systemPrompt = `${instructions}\n\n[RESUME CONTEXT]\n${resume}`;

  const userContent: Array<Record<string, unknown>> = [];
  if (audioBase64) {
    const parsedAudio = normalizeAudioInput(audioBase64);
    userContent.push({
      type: "input_audio",
      input_audio: {
        data: parsedAudio.data,
        format: parsedAudio.format,
      },
    });
  } else if (audioUrl) {
    userContent.push({
      type: "text",
      text: `User audio URL: ${audioUrl}`,
    });
  }

  userContent.push({ type: "text", text: message?.trim() || DEFAULT_USER_TEXT });

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY missing from environment variables.");
  }

  const qwenPayload = {
    model: "qwen3-omni-flash",
    stream: true,
    modalities: ["text", "audio"],
    audio: {
      voice: "Jada",
      format: DEFAULT_AUDIO_FORMAT,
    },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  };

  const response = await fetch(QWEN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-DashScope-SSE": "enable",
    },
    body: JSON.stringify(qwenPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Qwen API Error:", errorText);
    throw new Error(`Failed to fetch from Qwen API: ${errorText}`);
  }

  const streamedAudio = await collectAudioFromStream(response);
  const normalizedAudio = finalizeAudioForBrowser(streamedAudio.audioData, streamedAudio.format);
  const mimeType = AUDIO_MIME_BY_FORMAT[normalizedAudio.format] || `audio/${normalizedAudio.format}`;
  const audioDataUrl = `data:${mimeType};base64,${normalizedAudio.audioData.toString("base64")}`;

  return {
    audioObj: { audio: audioDataUrl },
  };
}
