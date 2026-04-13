import OpenAI from 'openai'

const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
const usingGroq = provider === 'groq'

let openaiClient: OpenAI | null = null

const getOpenAIClient = () => {
  if (openaiClient) {
    return openaiClient
  }

  ensureApiKey()
  openaiClient = new OpenAI({
    apiKey: usingGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
    ...(usingGroq ? { baseURL: 'https://api.groq.com/openai/v1' } : {}),
  })

  return openaiClient
}

const getModel = () => {
  if (usingGroq) {
    return process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  }

  return process.env.OPENAI_MODEL || 'gpt-4o-mini'
}

const ensureApiKey = () => {
  const key = usingGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY
  const placeholder = usingGroq ? 'replace_with_your_groq_key' : 'replace_with_your_openai_key'

  if (!key || key === placeholder) {
    if (usingGroq) {
      throw new Error('GROQ_API_KEY is missing. Set a valid key in backend/.env and restart backend.')
    }

    throw new Error('OPENAI_API_KEY is missing. Set a valid key in backend/.env and restart backend.')
  }
}

const getText = (content?: string | null) => content?.trim() || ''

const trimTo = (input: string, maxLen: number): string => input.slice(0, maxLen)

const sanitizeCodeBlock = (code: string): string => trimTo(code.replace(/\u0000/g, ''), 12000)

const sanitizeText = (value: string, maxLen = 1000): string => trimTo(value.replace(/\u0000/g, '').trim(), maxLen)

export function getAiProviderInfo() {
  return {
    provider,
    model: getModel(),
  }
}

export interface ExplanationRequest {
  code: string
  language: string
  problemName?: string
}

export interface HintRequest {
  problemName: string
  difficulty: string
  hintLevel: number // 1-3, where 3 is closest to solution
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  problemName?: string
}

export interface OptimizationRequest {
  code: string
  language: string
  problemName?: string
}

// Explain submitted code
export async function explainCode(req: ExplanationRequest): Promise<string> {
  const openai = getOpenAIClient()

  const safeLanguage = sanitizeText(req.language, 32)
  const safeProblemName = req.problemName ? sanitizeText(req.problemName, 80) : 'algorithm'
  const safeCode = sanitizeCodeBlock(req.code)

  const prompt = `You are an expert algorithm tutor. Explain the following ${safeLanguage} code for the "${safeProblemName}" problem in a clear, educational way. Focus on:
1. What the code does
2. Time and space complexity
3. Key algorithm concepts used
4. Any potential improvements

Code:
\`\`\`${safeLanguage}
${safeCode}
\`\`\``

  const response = await openai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are an expert algorithm tutor. Keep explanations practical and student-friendly.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return getText(response.choices[0]?.message?.content)
}

// Give graduated hints based on difficulty
export async function generateHint(req: HintRequest): Promise<string> {
  const openai = getOpenAIClient()

  const safeProblemName = sanitizeText(req.problemName, 80)
  const safeDifficulty = sanitizeText(req.difficulty, 24)

  const hintPrompts = {
    1: `Give a very general hint about the approach to solve "${safeProblemName}" (difficulty: ${safeDifficulty}). Do NOT reveal the solution. Hint should be 1-2 sentences.`,
    2: `Give a medium hint about solving "${safeProblemName}". Guide them toward the algorithm/approach but don't give code. 2-3 sentences.`,
    3: `Give a strong hint for "${safeProblemName}". You can mention the algorithm name and key steps, but avoid showing actual code. 3-4 sentences.`,
  }

  const prompt = hintPrompts[req.hintLevel as keyof typeof hintPrompts] || hintPrompts[1]

  const response = await openai.chat.completions.create({
    model: getModel(),
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'You are an algorithm coach. Give hints only, never full solutions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return getText(response.choices[0]?.message?.content)
}

// Chat interface for Q&A
export async function chatWithAI(req: ChatRequest): Promise<string> {
  const openai = getOpenAIClient()

  const safeProblemName = req.problemName ? sanitizeText(req.problemName, 100) : undefined

  const systemPrompt = `You are an expert algorithm educator helping students understand dynamic programming, sorting, pathfinding, and other algorithms. 
${safeProblemName ? `The student is learning about: ${safeProblemName}` : ''}
Be clear, concise, and educational. When asked about algorithms, explain concepts and provide complexity analysis.`

  const messages = req.messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: sanitizeText(msg.content, 1500),
  }))

  const response = await openai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
  })

  return getText(response.choices[0]?.message?.content)
}

// Validate syntax and provide error explanations
export async function validateAndExplainError(
  code: string,
  language: string,
  error: string
): Promise<string> {
  const openai = getOpenAIClient()

  const safeLanguage = sanitizeText(language, 32)
  const safeError = sanitizeText(error, 1200)
  const safeCode = sanitizeCodeBlock(code)

  const prompt = `A student got this error while writing ${safeLanguage} code for an algorithm problem:

Error: ${safeError}

Code:
\`\`\`${safeLanguage}
${safeCode}
\`\`\`

Explain what the error means in simple terms and suggest 2-3 ways to fix it. Be encouraging.`

  const response = await openai.chat.completions.create({
    model: getModel(),
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'You are a kind debugging tutor. Explain errors simply and suggest safe fixes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return getText(response.choices[0]?.message?.content)
}

// Suggest code optimizations
export async function suggestOptimizations(req: OptimizationRequest): Promise<string> {
  const openai = getOpenAIClient()

  const safeLanguage = sanitizeText(req.language, 32)
  const safeProblemName = req.problemName ? sanitizeText(req.problemName, 80) : 'an algorithm problem'
  const safeCode = sanitizeCodeBlock(req.code)

  const prompt = `Review this ${safeLanguage} solution for "${safeProblemName}" and suggest optimizations:

\`\`\`${safeLanguage}
${safeCode}
\`\`\`

Provide 2-3 specific optimization suggestions focusing on:
1. Time complexity improvements
2. Space complexity improvements
3. Code clarity and best practices

Format as a numbered list with explanations.`

  const response = await openai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a code reviewer focused on algorithmic performance and readability.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return getText(response.choices[0]?.message?.content)
}
