import type { StoryboardScene } from "../contracts/plan.js";
import type { ElevenLabsAlignment } from "../contracts/alignment.js";
import type { BlockTiming, WordTiming } from "./captionGrouper.js";

export function mapAlignmentToBlockTimings(
  scene: StoryboardScene,
  alignment: ElevenLabsAlignment
): BlockTiming[] {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  // 1. Group characters into timed words
  const extractedWords: WordTiming[] = [];
  let currentWordChars: string[] = [];
  let currentWordStartSec = -1;
  let currentWordEndSec = -1;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const s = starts[i];
    const e = ends[i];

    if (/\s/.test(ch)) {
      if (currentWordChars.length > 0) {
        extractedWords.push({
          word: currentWordChars.join(""),
          startMs: Math.round(currentWordStartSec * 1000),
          endMs: Math.round(currentWordEndSec * 1000),
        });
        currentWordChars = [];
        currentWordStartSec = -1;
        currentWordEndSec = -1;
      }
    } else {
      if (currentWordChars.length === 0) {
        currentWordStartSec = s;
      }
      currentWordChars.push(ch);
      currentWordEndSec = e;
    }
  }

  if (currentWordChars.length > 0) {
    extractedWords.push({
      word: currentWordChars.join(""),
      startMs: Math.round(currentWordStartSec * 1000),
      endMs: Math.round(currentWordEndSec * 1000),
    });
  }

  // 2. Map extracted words to narration blocks in sequence
  const result: BlockTiming[] = [];
  let wordCursor = 0;

  for (const block of scene.narration) {
    const expectedWords = block.text.trim().split(/\s+/).filter(Boolean);
    const blockWords: WordTiming[] = [];

    for (let j = 0; j < expectedWords.length; j++) {
      if (wordCursor < extractedWords.length) {
        blockWords.push(extractedWords[wordCursor]);
        wordCursor++;
      } else {
        // Fallback: estimate from last word if provider omitted trailing punctuation/word
        const lastMs = blockWords.length > 0 ? blockWords[blockWords.length - 1].endMs : 0;
        blockWords.push({
          word: expectedWords[j],
          startMs: lastMs + 50,
          endMs: lastMs + 350,
        });
      }
    }

    result.push({
      blockId: block.id,
      text: block.text.trim(),
      words: blockWords,
    });
  }

  return result;
}

export function resolvePhraseTimingFromBlock(
  blockTiming: BlockTiming,
  phrase: string,
  occurrence: number
): { startMs: number; endMs: number } {
  const text = blockTiming.text.toLocaleLowerCase();
  const needle = phrase.toLocaleLowerCase().trim();

  let occurrenceIndex = 0;
  let charIndex = -1;
  let cursor = 0;

  while (occurrenceIndex < occurrence) {
    charIndex = text.indexOf(needle, cursor);
    if (charIndex === -1) {
      throw new Error(`Phrase "${phrase}" occurrence ${occurrence} not found in text "${blockTiming.text}".`);
    }
    occurrenceIndex++;
    cursor = charIndex + Math.max(1, needle.length);
  }

  const textBefore = blockTiming.text.slice(0, charIndex);
  const wordsBefore = textBefore.trim().split(/\s+/).filter(Boolean);
  const startWordIdx = textBefore.trim().length === 0 ? 0 : wordsBefore.length;

  const phraseWords = phrase.trim().split(/\s+/).filter(Boolean);
  const endWordIdx = Math.min(blockTiming.words.length - 1, startWordIdx + phraseWords.length - 1);

  const startWord = blockTiming.words[Math.min(startWordIdx, blockTiming.words.length - 1)];
  const endWord = blockTiming.words[Math.max(0, endWordIdx)];

  return {
    startMs: startWord ? startWord.startMs : 0,
    endMs: endWord ? endWord.endMs : 500,
  };
}

