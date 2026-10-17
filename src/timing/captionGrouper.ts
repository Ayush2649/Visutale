import type { CaptionCue } from "../contracts/timeline.js";

export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface BlockTiming {
  blockId: string;
  text: string;
  words: WordTiming[];
}

/**
 * Breaks a sequence of timed words into readable, mobile-safe caption cues.
 * Max 2 lines per cue, max ~36 characters per line.
 */
export function groupWordsIntoCaptions(
  blockTimings: BlockTiming[],
  sceneStartFrame: number,
  sceneEndFrame: number,
  fps: number
): CaptionCue[] {
  const cues: CaptionCue[] = [];
  let cueIndex = 1;

  for (const block of blockTimings) {
    if (block.words.length === 0) continue;

    // Group words into phrases of ~5 to 8 words or punctuation boundaries
    const phrases: WordTiming[][] = [];
    let currentPhrase: WordTiming[] = [];
    let currentLength = 0;

    for (let i = 0; i < block.words.length; i++) {
      const wt = block.words[i];
      currentPhrase.push(wt);
      currentLength += wt.word.length + 1;

      const hasPunctuation = /[.,!?;:]$/.test(wt.word);
      const isLongEnough = currentPhrase.length >= 6 || currentLength >= 32;
      const isLastWord = i === block.words.length - 1;

      if ((hasPunctuation && currentPhrase.length >= 3) || isLongEnough || isLastWord) {
        phrases.push(currentPhrase);
        currentPhrase = [];
        currentLength = 0;
      }
    }

    if (currentPhrase.length > 0) {
      phrases.push(currentPhrase);
    }

    for (const phrase of phrases) {
      if (phrase.length === 0) continue;
      const startMs = phrase[0].startMs;
      const endMs = phrase[phrase.length - 1].endMs;

      // Format caption text into at most 2 lines, wrapped safely
      const fullText = phrase.map((w) => w.word).join(" ");
      const formattedText = wrapToTwoLines(fullText, 36);

      const startFrame = Math.max(sceneStartFrame, sceneStartFrame + Math.floor((startMs / 1000) * fps));
      const endFrame = Math.min(sceneEndFrame, sceneStartFrame + Math.ceil((endMs / 1000) * fps));

      if (endFrame > startFrame) {
        cues.push({
          id: `caption-${block.blockId}-${cueIndex++}`,
          text: formattedText,
          startFrame,
          endFrame,
          startMs,
          endMs,
        });
      }
    }
  }

  // Ensure captions are strictly ordered without backwards jumps
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].startFrame < cues[i - 1].endFrame) {
      cues[i].startFrame = cues[i - 1].endFrame;
      if (cues[i].endFrame <= cues[i].startFrame) {
        cues[i].endFrame = cues[i].startFrame + 1;
      }
    }
  }

  return cues;
}

export function wrapToTwoLines(text: string, maxLineLength = 36): string {
  const words = text.split(" ");
  if (words.length <= 1 || text.length <= maxLineLength) return text;

  // Find midpoint split
  let bestSplit = 1;
  let minDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    if (line1.length <= maxLineLength && line2.length <= maxLineLength) {
      const diff = Math.abs(line1.length - line2.length);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = i;
      }
    }
  }

  const line1 = words.slice(0, bestSplit).join(" ");
  const line2 = words.slice(bestSplit).join(" ");
  return `${line1}\n${line2}`;
}

