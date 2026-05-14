import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import fs from 'fs'
import { performance } from 'perf_hooks'
import { QuizStore } from './quizStore.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const quizConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'quizConfig.json'), 'utf8'))
const store = new QuizStore(quizConfig)

let activeSessionSid = null

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || (isProd ? 3000 : 3001)

app.use(express.json())
app.use(cors())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: isProd ? 'production' : 'development' })
})

// Start quiz session
  app.post('/api/quiz/start', (req, res) => {
  const { password } = req.body
  if (password !== process.env.QUIZ_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sid = store.createSession()
  activeSessionSid = sid
  const hostQuestions = quizConfig.questions.map(({ id, question, options, answer, timeLimit }) => ({ id, question, options, answer, timeLimit }))
  res.json({ sid, questions: hostQuestions })
})

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id)

  // Simple Multi-Sample SNTP-like time sync
  socket.on('sync:ping', ({ t1 }) => {
    const t2 = performance.now()
    socket.emit('sync:pong', { t1, t2, t3: performance.now() })
  })

  // If a quiz is already active, tell the new client
  if (activeSessionSid) {
    socket.emit('quiz:started', { sid: activeSessionSid })
  }

  socket.on('host:join', ({ sid }) => {
    const session = store.getSession(sid)
    if (!session) {
      return socket.emit('error', { message: 'Invalid session' })
    }
    session.hostSocketId = socket.id
    socket.join(`host:${sid}`)
    console.log(`Host joined session ${sid}`)
    
    // Send questions to the host (including options and answer for host display)
    const hostQuestions = quizConfig.questions.map(({ id, question, options, answer, timeLimit }) => ({ id, question, options, answer, timeLimit }))
    socket.emit('host:questions', hostQuestions)

    // Notify all connected clients that a quiz is starting
    io.emit('quiz:started', { sid })
  })

  socket.on('player:join', ({ sid, name }) => {
    const session = store.getSession(sid)
    if (!session) {
      return socket.emit('error', { message: 'Invalid session' })
    }

    const registration = store.registerPlayer(sid, socket.id, name)
    if (!registration) {
      return socket.emit('error', { message: 'Invalid session' })
    }
    if (registration.error) {
      return socket.emit('error', { message: registration.error })
    }

    socket.join(`players:${sid}`)
    socket.emit('player:registered', { name, sid, playerId: registration.playerId })
    
    // If a question is active and not idle, send it to the late joiner
    if (session.currentQuestion && !session.isIdle) {
      const { answer, ...clientQuestion } = session.currentQuestion
      socket.emit('question:start', { ...clientQuestion, startTime: session.questionStartTime })
    }

    // Notify host that a player joined
    io.to(`host:${sid}`).emit('host:player-joined', { 
      count: session.players.size 
    })
    
    console.log(`Player ${name} joined session ${sid}`)
  })

  socket.on('player:reconnect', ({ sid, playerId }) => {
    const session = store.getSession(sid)
    if (!session) return socket.emit('error', { message: 'Session expired' })

    const player = store.reconnectPlayer(sid, playerId, socket.id)
    if (!player) return socket.emit('error', { message: 'Player not found' })

    socket.join(`players:${sid}`)
    // Determine current state for player
    let currentState = 'LOBBY'
    if (session.currentQuestion && !session.isIdle) {
      const isCountdown = performance.now() < session.questionStartTime
      currentState = isCountdown ? 'COUNTDOWN' : 'QUESTION'
    }

    socket.emit('player:reconnected', { 
      name: player.name, 
      sid, 
      score: player.score,
      gameState: currentState
    })

    // If a question is active, send it to the player
    if (session.currentQuestion && !session.isIdle) {
      const { answer, ...clientQuestion } = session.currentQuestion
      const hasAnswered = !!player.answers[session.currentQuestion.id]
      
      if (hasAnswered) {
        socket.emit('answer:ack')
      } else {
        socket.emit('question:start', { ...clientQuestion, startTime: session.questionStartTime })
      }
    }
    
    console.log(`Player ${player.name} reconnected to session ${sid}`)
  })

  socket.on('host:reconnect', ({ sid }) => {
    const session = store.getSession(sid)
    if (!session) return socket.emit('error', { message: 'Session expired' })

    store.reconnectHost(sid, socket.id)
    activeSessionSid = sid // Ensure this session is the active one for new joiners
    socket.join(`host:${sid}`)
    
    // Send questions to the host (including options and answer for host display)
    const hostQuestions = quizConfig.questions.map(({ id, question, options, answer, timeLimit }) => ({ id, question, options, answer, timeLimit }))
    
    // Determine current state for host
    let currentState = 'LOBBY'
    let currentQuestionIndex = -1
    if (session.currentQuestion) {
      const isCountdown = performance.now() < session.questionStartTime
      currentState = isCountdown ? 'COUNTDOWN' : 'QUESTION'
      currentQuestionIndex = quizConfig.questions.findIndex(q => q.id === session.currentQuestion.id)
    }

    socket.emit('host:reconnected', { 
      sid, 
      questions: hostQuestions,
      currentState,
      currentQuestionIndex,
      startTime: session.questionStartTime,
      playerCount: {
        count: session.answersCount,
        total: session.players.size
      }
    })
    
    console.log(`Host reconnected to session ${sid}`)
  })

  socket.on('host:start-question', ({ sid, questionId }) => {
    const session = store.getSession(sid)
    if (!session || session.hostSocketId !== socket.id) return

    const question = quizConfig.questions.find(q => q.id === questionId)
    if (!question) return

    // Shuffle options for this session's run of the question
    const shuffledQuestion = {
      ...question,
      options: shuffleArray(question.options)
    }

    // Clear any existing timeout
    if (session.questionTimeout) {
      clearTimeout(session.questionTimeout)
      session.questionTimeout = null
    }

    session.currentQuestion = shuffledQuestion
    session.answersCount = 0
    session.isIdle = false
    
    // 3 second delay before accepting answers
    const DELAY = 3000
    session.questionStartTime = performance.now() + DELAY
    session.questionEndTime = session.questionStartTime + (question.timeLimit * 1000)

    // Broadcast question to players and host
    const { answer, ...clientQuestion } = shuffledQuestion
    io.to(`players:${sid}`).emit('question:start', { ...clientQuestion, startTime: session.questionStartTime })
    io.to(`host:${sid}`).emit('host:question-start', { ...clientQuestion, startTime: session.questionStartTime })

    // Set timer to end question automatically
    session.questionTimeout = setTimeout(() => {
      endQuestion(sid, questionId)
    }, (question.timeLimit * 1000) + DELAY)
  })

  socket.on('player:answer', ({ sid, questionId, answer, timestamp }) => {
    const result = store.submitAnswer(sid, socket.id, questionId, answer, timestamp)
    
    if (result && result.error) {
      return socket.emit('error', { message: result.error })
    }

    if (result) {
      socket.emit('answer:ack', { received: true })
      
      // Notify host of answer count
      io.to(`host:${sid}`).emit('host:player-answered', { 
        count: result.answersCount, 
        total: store.getSession(sid).players.size 
      })

      // If everyone answered, end question early
      if (result.everyoneAnswered) {
        const session = store.getSession(sid)
        if (session.questionTimeout) {
          clearTimeout(session.questionTimeout)
          session.questionTimeout = null
        }
        endQuestion(sid, questionId)
      }
    }
  })

  socket.on('host:set-idle', ({ sid }) => {
    const session = store.getSession(sid)
    if (!session || session.hostSocketId !== socket.id) return
    
    session.isIdle = true
    io.to(`players:${sid}`).emit('player:idle')
  })

  socket.on('host:end-quiz', ({ sid }) => {
    const session = store.getSession(sid)
    if (!session || session.hostSocketId !== socket.id) return

    if (session.questionTimeout) {
      clearTimeout(session.questionTimeout)
      session.questionTimeout = null
    }

    const leaderboard = store.getLeaderboard(sid)
    
  // Notify final results to all players
  session.players.forEach((player) => {
    const rank = store.getPlayerRank(sid, player.socketId)
    io.to(player.socketId).emit('quiz:results', {
      score: player.score,
      rank,
      totalPlayers: leaderboard.length
    })
  })

    // Send final results to host
    io.to(`host:${sid}`).emit('quiz:final-leaderboard', leaderboard)

    store.invalidateSession(sid)
    if (activeSessionSid === sid) activeSessionSid = null
  })

  socket.on('disconnect', () => {
    // Clean up if needed
  })
})

function endQuestion(sid, questionId) {
  const session = store.getSession(sid)
  if (!session || !session.currentQuestion || session.currentQuestion.id !== questionId) return

  if (session.questionTimeout) {
    clearTimeout(session.questionTimeout)
    session.questionTimeout = null
  }

  const leaderboard = store.getLeaderboard(sid)
  const top5 = leaderboard.slice(0, 5).map(p => {
    // Find the player in session to get their last points
    const playerObj = Array.from(session.players.values()).find(pl => pl.name === p.name);
    const lastAnswer = playerObj && playerObj.answers[questionId] ? playerObj.answers[questionId] : { points: 0 };
    return { ...p, lastPoints: lastAnswer.points };
  })
  const answerDistribution = store.getAnswerDistribution(sid, questionId)

  // Notify each player of their standing
  session.players.forEach((player) => {
    const rank = store.getPlayerRank(sid, player.socketId)
    const lastAnswer = player.answers[questionId] || { correct: false, points: 0 }
    
    io.to(player.socketId).emit('question:ended', {
      correctAnswer: session.currentQuestion.answer,
      isCorrect: lastAnswer.correct,
      pointsGained: lastAnswer.points,
      totalScore: player.score,
      rank,
      totalPlayers: leaderboard.length
    })
  })

  // Notify host of top 5 and answer distribution
  io.to(`host:${sid}`).emit('question:leaderboard', {
    top5,
    answerDistribution
  })

  session.currentQuestion = null
}

if (isProd) {
  const dist = path.join(__dirname, '../client/dist')
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

httpServer.listen(PORT, () => {
  console.log(`API       http://localhost:${PORT}/api/health`)
  console.log(`Present   http://localhost:${PORT}/present`)
  console.log(`Kahoot    http://localhost:${PORT}/`)
  if (isProd) {
    console.log(`App (Prod) http://localhost:${PORT}/`)
  }
})
