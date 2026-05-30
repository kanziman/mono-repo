import type { Segment, Persona } from '@/types'

const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  angela:
    'You are a tutor in the style of Angela Duckworth. Focus on grit, perseverance, psychological insights, and growth mindset when helping learners understand and practice English.',
  mike:
    'You are a tutor in the style of Mike Maughan. Be practical, humorous, conversational, and use relatable examples to help learners understand and practice English.',
  general:
    'You are a general English tutor. Provide clear explanations about grammar, vocabulary, and pronunciation to help learners improve their English skills.',
}

const MAX_TRANSCRIPT_LENGTH = 3000

export function buildSystemPrompt(
  persona: Persona,
  episodeTitle: string,
  allSegments: Segment[],
  currentSegment?: Segment
): string {
  const personaDescription = PERSONA_DESCRIPTIONS[persona]

  const fullTranscript = allSegments.map((s) => s.text).join(' ')
  const transcript =
    fullTranscript.length > MAX_TRANSCRIPT_LENGTH
      ? fullTranscript.slice(0, MAX_TRANSCRIPT_LENGTH) + '...'
      : fullTranscript

  const parts: string[] = [
    personaDescription,
    `The episode title is: "${episodeTitle}".`,
    `Full transcript (may be truncated):\n${transcript}`,
  ]

  if (currentSegment) {
    parts.push(`The learner is currently studying this segment: "${currentSegment.text}"`)
  }

  parts.push('한국어로 응답하되, 사용자가 영어로 질문하면 영어로 답변합니다.')

  return parts.join('\n\n')
}
