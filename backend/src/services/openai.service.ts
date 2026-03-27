import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  const prompt = `You are an expert algorithm tutor. Explain the following ${req.language} code for the "${req.problemName || 'algorithm'}" problem in a clear, educational way. Focus on:
1. What the code does
2. Time and space complexity
3. Key algorithm concepts used
4. Any potential improvements

Code:
\`\`\`${req.language}
${req.code}
\`\`\``

  const message = await openai.messages.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Give graduated hints based on difficulty
export async function generateHint(req: HintRequest): Promise<string> {
  const hintPrompts = {
    1: `Give a very general hint about the approach to solve "${req.problemName}" (difficulty: ${req.difficulty}). Do NOT reveal the solution. Hint should be 1-2 sentences.`,
    2: `Give a medium hint about solving "${req.problemName}". Guide them toward the algorithm/approach but don't give code. 2-3 sentences.`,
    3: `Give a strong hint for "${req.problemName}". You can mention the algorithm name and key steps, but avoid showing actual code. 3-4 sentences.`,
  }

  const prompt = hintPrompts[req.hintLevel as keyof typeof hintPrompts] || hintPrompts[1]

  const message = await openai.messages.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Chat interface for Q&A
export async function chatWithAI(req: ChatRequest): Promise<string> {
  const systemPrompt = `You are an expert algorithm educator helping students understand dynamic programming, sorting, pathfinding, and other algorithms. 
${req.problemName ? `The student is learning about: ${req.problemName}` : ''}
Be clear, concise, and educational. When asked about algorithms, explain concepts and provide complexity analysis.`

  const messages = req.messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  const response = await openai.messages.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// Validate syntax and provide error explanations
export async function validateAndExplainError(
  code: string,
  language: string,
  error: string
): Promise<string> {
  const prompt = `A student got this error while writing ${language} code for an algorithm problem:

Error: ${error}

Code:
\`\`\`${language}
${code}
\`\`\`

Explain what the error means in simple terms and suggest 2-3 ways to fix it. Be encouraging.`

  const message = await openai.messages.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Suggest code optimizations
export async function suggestOptimizations(req: OptimizationRequest): Promise<string> {
  const prompt = `Review this ${req.language} solution for "${req.problemName || 'an algorithm problem'}" and suggest optimizations:

\`\`\`${req.language}
${req.code}
\`\`\`

Provide 2-3 specific optimization suggestions focusing on:
1. Time complexity improvements
2. Space complexity improvements
3. Code clarity and best practices

Format as a numbered list with explanations.`

  const message = await openai.messages.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
