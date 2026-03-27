import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/ai.db')

// Ensure data directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(dbPath)

export interface ChatHistoryEntry {
  id: string
  problem_id: string
  user_message: string
  ai_response: string
  timestamp: number
}

export interface ExplanationHistory {
  id: string
  problem_id: string
  code_snippet: string
  explanation: string
  language: string
  timestamp: number
}

export interface HintHistory {
  id: string
  problem_id: string
  hint_level: number
  hint_text: string
  timestamp: number
}

export function initializeDatabase() {
  db.exec(
    `
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS explanation_history (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      code_snippet TEXT NOT NULL,
      explanation TEXT NOT NULL,
      language TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hint_history (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      hint_level INTEGER NOT NULL,
      hint_text TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY,
      feature_type TEXT NOT NULL,
      problem_id TEXT,
      tokens_used INTEGER,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_problem ON chat_history(problem_id);
    CREATE INDEX IF NOT EXISTS idx_explanation_problem ON explanation_history(problem_id);
    CREATE INDEX IF NOT EXISTS idx_hint_problem ON hint_history(problem_id);
  `
  )
}

// Chat history functions
export function saveChatMessage(
  problemId: string,
  userMessage: string,
  aiResponse: string
): ChatHistoryEntry {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  const stmt = db.prepare(`
    INSERT INTO chat_history (id, problem_id, user_message, ai_response, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, problemId, userMessage, aiResponse, timestamp)

  return { id, problem_id: problemId, user_message: userMessage, ai_response: aiResponse, timestamp }
}

export function getChatHistory(problemId: string, limit: number = 20): ChatHistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM chat_history
    WHERE problem_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `)

  return stmt.all(problemId, limit) as ChatHistoryEntry[]
}

// Explanation history functions
export function saveExplanation(
  problemId: string,
  code: string,
  explanation: string,
  language: string
): ExplanationHistory {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  const stmt = db.prepare(`
    INSERT INTO explanation_history (id, problem_id, code_snippet, explanation, language, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, problemId, code, explanation, language, timestamp)

  return {
    id,
    problem_id: problemId,
    code_snippet: code,
    explanation,
    language,
    timestamp,
  }
}

export function getExplanationHistory(problemId: string, limit: number = 10): ExplanationHistory[] {
  const stmt = db.prepare(`
    SELECT * FROM explanation_history
    WHERE problem_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `)

  return stmt.all(problemId, limit) as ExplanationHistory[]
}

// Hint history functions
export function saveHint(problemId: string, hintLevel: number, hintText: string): HintHistory {
  const id = `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  const stmt = db.prepare(`
    INSERT INTO hint_history (id, problem_id, hint_level, hint_text, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, problemId, hintLevel, hintText, timestamp)

  return {
    id,
    problem_id: problemId,
    hint_level: hintLevel,
    hint_text: hintText,
    timestamp,
  }
}

export function getHintHistory(problemId: string): HintHistory[] {
  const stmt = db.prepare(`
    SELECT * FROM hint_history
    WHERE problem_id = ?
    ORDER BY timestamp DESC
  `)

  return stmt.all(problemId) as HintHistory[]
}

// Usage tracking
export function trackUsage(featureType: string, problemId: string | null, tokensUsed: number = 0) {
  const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  const stmt = db.prepare(`
    INSERT INTO ai_usage (id, feature_type, problem_id, tokens_used, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, featureType, problemId, tokensUsed, timestamp)
}

export function closeDatabase() {
  db.close()
}
