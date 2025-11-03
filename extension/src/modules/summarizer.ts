import type { SummarizeRequest, SummarizeResponse } from '../types'

const SENTENCE_DELIMITERS = /(?<=[.!?])\s+/g

export async function summarizeText (request: SummarizeRequest, backendUrl?: string): Promise<SummarizeResponse> {
  const sentences = request.text.split(SENTENCE_DELIMITERS).filter(Boolean)

  if (sentences.length <= (request.maxSentences ?? 3)) {
    return {
      nodeId: request.nodeId,
      summary: request.text,
      method: 'local'
    }
  }

  if (sentences.length > 20 && backendUrl != null) {
    try {
      const response = await fetch(`${backendUrl}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          max_sentences: request.maxSentences ?? 3
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          nodeId: request.nodeId,
          summary: data.summary,
          method: 'api'
        }
      }
    } catch (error) {
      console.warn('Remote summarization failed, falling back to local', error)
    }
  }

  const summary = performLocalSummarization(sentences, request.maxSentences ?? 3)
  return {
    nodeId: request.nodeId,
    summary,
    method: 'local'
  }
}

function performLocalSummarization (sentences: string[], maxSentences: number): string {
  const sentenceScores = new Map<string, number>()
  const tf = new Map<string, number>()
  const allWords: string[][] = []

  sentences.forEach((sentence) => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
    allWords.push(words)
    words.forEach((word) => {
      tf.set(word, (tf.get(word) ?? 0) + 1)
    })
  })

  sentences.forEach((sentence, index) => {
    const words = allWords[index]
    const score = words.reduce((acc, word) => acc + (tf.get(word) ?? 0), 0) / (words.length || 1)
    sentenceScores.set(sentence, score)
  })

  const ranked = Array.from(sentenceScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSentences)

  const order = new Map(ranked.map(([sentence], index) => [sentence, index]))
  return ranked
    .map(([sentence]) => sentence)
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    .join(' ')
}

