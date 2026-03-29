import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  explainCode,
  generateHint,
  chatWithAI,
  validateAndExplainError,
  suggestOptimizations,
  getAiProviderInfo,
  type ChatMessage,
} from '../services/openai.service.js'
import {
  saveChatMessage,
  getChatHistory,
  saveExplanation,
  getExplanationHistory,
  saveHint,
  getHintHistory,
  trackUsage,
} from '../db/database.js'

const router = Router()

// Middleware to handle errors
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

const asyncHandler = (fn: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

const MAX_CODE_LENGTH = 12000
const MAX_CHAT_MESSAGES = 20
const MAX_CHAT_MESSAGE_LENGTH = 1500

const asString = (value: unknown): string => (typeof value === 'string' ? value : '')

router.get('/status', (_req: Request, res: Response) => {
  const info = getAiProviderInfo()
  res.json({
    ok: true,
    provider: info.provider,
    model: info.model,
  })
})

// 1. Explain Code Endpoint
router.post(
  '/explain',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, language, problemName } = req.body

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' })
    }

    if (asString(code).length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `Code is too long. Limit is ${MAX_CODE_LENGTH} characters.` })
    }

    const explanation = await explainCode({ code, language, problemName })

    // Save to history
    saveExplanation(problemName || 'unknown', code, explanation, language)
    trackUsage('explain', problemName)

    res.json({ explanation })
  })
)

// 2. Get Hint Endpoint
router.post(
  '/hint',
  asyncHandler(async (req: Request, res: Response) => {
    const { problemName, difficulty = 'medium', hintLevel = 1 } = req.body

    if (!problemName) {
      return res.status(400).json({ error: 'Problem name is required' })
    }

    const level = Math.min(3, Math.max(1, hintLevel))
    const hint = await generateHint({ problemName, difficulty, hintLevel: level })

    // Save to history
    saveHint(problemName, level, hint)
    trackUsage('hint', problemName)

    res.json({ hint, level })
  })
)

// 3. Chat Endpoint
router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { messages, problemName } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    if (messages.length > MAX_CHAT_MESSAGES) {
      return res.status(400).json({ error: `Too many messages. Limit is ${MAX_CHAT_MESSAGES}.` })
    }

    const normalizedMessages: ChatMessage[] = messages
      .map((message: unknown) => {
        const role = typeof (message as { role?: unknown })?.role === 'string' ? (message as { role: string }).role : ''
        const content = asString((message as { content?: unknown })?.content)
        return {
          role: (role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: content.slice(0, MAX_CHAT_MESSAGE_LENGTH),
        }
      })
      .filter((message) => message.content.length > 0)

    if (normalizedMessages.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty message is required' })
    }

    const response = await chatWithAI({ messages: normalizedMessages, problemName })

    // Save chat to history
    const lastUserMessage = messages[messages.length - 1].content
    saveChatMessage(problemName || 'general', lastUserMessage, response)
    trackUsage('chat', problemName)

    res.json({ response })
  })
)

// 4. Get Chat History Endpoint
router.get(
  '/chat-history/:problemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { problemId } = req.params
    const history = getChatHistory(problemId)

    res.json({ history })
  })
)

// 5. Validate Code & Explain Error Endpoint
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, language, error } = req.body

    if (!code || !language || !error) {
      return res.status(400).json({ error: 'Code, language, and error message are required' })
    }

    if (asString(code).length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `Code is too long. Limit is ${MAX_CODE_LENGTH} characters.` })
    }

    const explanation = await validateAndExplainError(code, language, error)

    trackUsage('validate', null)

    res.json({ explanation })
  })
)

// 6. Code Optimization Endpoint
router.post(
  '/optimize',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, language, problemName } = req.body

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' })
    }

    if (asString(code).length > MAX_CODE_LENGTH) {
      return res.status(400).json({ error: `Code is too long. Limit is ${MAX_CODE_LENGTH} characters.` })
    }

    const suggestions = await suggestOptimizations({ code, language, problemName })

    trackUsage('optimize', problemName)

    res.json({ suggestions })
  })
)

// 7. Get Hint History Endpoint
router.get(
  '/hint-history/:problemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { problemId } = req.params
    const history = getHintHistory(problemId)

    res.json({ history })
  })
)

// 8. Get Explanation History Endpoint
router.get(
  '/explanation-history/:problemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { problemId } = req.params
    const history = getExplanationHistory(problemId)

    res.json({ history })
  })
)

// Error handler
router.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('API Error:', err)

  const openaiType = err?.error?.type || err?.type
  const openaiCode = err?.error?.code || err?.code

  if (openaiType === 'invalid_request_error') {
    return res.status(400).json({ error: 'Invalid request to AI service' })
  }

  if (openaiType === 'authentication_error') {
    return res.status(401).json({ error: 'Authentication error with AI service' })
  }

  if (openaiType === 'rate_limit_error') {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' })
  }

  if (openaiCode === 'insufficient_quota' || openaiType === 'insufficient_quota') {
    return res.status(402).json({
      error: 'OpenAI quota exceeded. Add billing/credits in your OpenAI account or use a different API key.',
    })
  }

  res.status(500).json({
    error: 'An error occurred processing your request',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

export default router
