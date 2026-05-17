// --- index.js ---
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


// --- quizStore.js ---
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';

export class QuizStore {
  constructor(config) {
    this.questions = config.questions;
    this.sessions = new Map(); // sid -> sessionData
  }

  createSession() {
    const sid = uuidv4();
    this.sessions.set(sid, {
      sid,
      hostSocketId: null,
      players: new Map(), // playerId -> player
      socketToPlayer: new Map(), // socketId -> playerId
      playerNames: new Map(), // name -> playerId (to prevent duplicates)
      currentQuestion: null,
      questionStartTime: null, // performance.now()
      questionEndTime: null, // performance.now()
      questionTimeout: null,
      answersCount: 0,
      results: [],
      isStarted: false,
      isFinished: false,
      isIdle: false
    });
    return sid;
  }

  getSession(sid) {
    return this.sessions.get(sid);
  }

  invalidateSession(sid) {
    this.sessions.delete(sid);
  }

  registerPlayer(sid, socketId, name) {
    const session = this.sessions.get(sid);
    if (!session) return null;
    
    if (session.playerNames.has(name)) {
      return { error: 'Name already taken' };
    }

    const playerId = uuidv4();
    const player = {
      playerId,
      socketId,
      name,
      score: 0,
      answers: {} // questionId -> { correct, points, timeTaken }
    };

    session.players.set(playerId, player);
    session.socketToPlayer.set(socketId, playerId);
    session.playerNames.set(name, playerId);
    return player;
  }

  reconnectPlayer(sid, playerId, newSocketId) {
    const session = this.sessions.get(sid);
    if (!session) return null;

    const player = session.players.get(playerId);
    if (!player) return null;

    // Update socket mappings
    const oldSocketId = player.socketId;
    session.socketToPlayer.delete(oldSocketId);
    
    player.socketId = newSocketId;
    session.socketToPlayer.set(newSocketId, playerId);
    
    return player;
  }

  reconnectHost(sid, newSocketId) {
    const session = this.sessions.get(sid);
    if (!session) return null;
    session.hostSocketId = newSocketId;
    return session;
  }

  calculatePoints(question, timeTaken, isCorrect) {
    if (!isCorrect) return 0;
    
    const T = question.timeLimit * 1000;
    const t = Math.max(0, Math.min(timeTaken, T));
    
    // Non-linear: Score = 500 + 500 * (1 - sqrt(t/T))
    // This makes the drop-off steepest at the beginning (harder to get the top points)
    let points = 500 + 500 * (1 - Math.sqrt(t / T));
    
    if (question.doublePoints) {
      points *= 2;
    }
    
    return Math.round(points);
  }

  submitAnswer(sid, socketId, questionId, answer, clientPerformanceTimestamp) {
    const session = this.sessions.get(sid);
    if (!session || !session.currentQuestion || session.currentQuestion.id !== questionId) return null;

    const playerId = session.socketToPlayer.get(socketId);
    const player = playerId ? session.players.get(playerId) : null;
    if (!player || player.answers[questionId]) return null;

    const now = performance.now();
    
    // Only accept answers after the questionStartTime (3s delay)
    if (now < session.questionStartTime - 500) { // 500ms grace for network jitter
      return { error: 'Too early' };
    }

    // Use the client's reported performance timestamp (synced via SNTP)
    // Validate it's not too far in the past or future relative to server's 'now'
    let usedTimestamp = clientPerformanceTimestamp;
    const diff = Math.abs(now - clientPerformanceTimestamp);
    if (diff > 5000) { // 5 seconds grace period
       usedTimestamp = now;
    }

    const timeTaken = Math.max(0, usedTimestamp - session.questionStartTime);
    const isCorrect = answer === session.currentQuestion.answer;
    const points = this.calculatePoints(session.currentQuestion, timeTaken, isCorrect);

    player.answers[questionId] = {
      correct: isCorrect,
      points,
      timeTaken,
      answer // Store the actual answer selected
    };
    player.score += points;
    session.answersCount++;

    const everyoneAnswered = session.answersCount >= session.players.size;

    return { points, totalScore: player.score, isCorrect, everyoneAnswered, answersCount: session.answersCount };
  }

  getLeaderboard(sid) {
    const session = this.sessions.get(sid);
    if (!session) return [];

    return Array.from(session.players.values())
      .map(p => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  getPlayerRank(sid, socketId) {
    const leaderboard = this.getLeaderboard(sid);
    const session = this.sessions.get(sid);
    const playerId = session?.socketToPlayer.get(socketId);
    const player = playerId ? session?.players.get(playerId) : null;
    if (!player) return -1;
    return leaderboard.findIndex(p => p.name === player.name) + 1;
  }

  getAnswerDistribution(sid, questionId) {
    const session = this.sessions.get(sid);
    if (!session) return {};

    const distribution = {};
    // Initialize with 0 for all options
    if (session.currentQuestion && session.currentQuestion.id === questionId) {
      session.currentQuestion.options.forEach(opt => {
        distribution[opt] = 0;
      });
    }

    session.players.forEach(player => {
      const answerData = player.answers[questionId];
      if (answerData && answerData.answer) {
        distribution[answerData.answer] = (distribution[answerData.answer] || 0) + 1;
      }
    });

    return distribution;
  }
}


// --- quizConfig.json ---
{
  "questions": [
    {
      "id": "q_navo",
      "question": "Waarvoor staat de afkorting NAVO?",
      "type": "multiple-choice",
      "options": ["Noord-Atlantische Verdragsorganisatie", "Noord-Atlantische Veiligheids-Organisatie", "Nationaal Ambtelijk Verbond voor Ontwikkeling", "Neutraal Alliantie-Verbond voor Opvang"],
      "answer": "Noord-Atlantische Verdragsorganisatie",
      "timeLimit": 20,
      "doublePoints": false
    },
    {
      "id": "q_berlin_wall",
      "question": "Hoe lang was de Berlijnse Muur in totaal?",
      "type": "multiple-choice",
      "options": ["155km", "135km", "165km", "180km"],
      "answer": "155km",
      "timeLimit": 20,
      "doublePoints": false
    },
    {
      "id": "q_mi6",
      "question": "Wie is de inlichtingendienst van het Verenigd Koninkrijk?",
      "type": "multiple-choice",
      "options": ["MI6", "CIA", "FBI", "KGB"],
      "answer": "MI6",
      "timeLimit": 15,
      "doublePoints": false
    },
    {
      "id": "q_ussr_fall",
      "question": "In welk jaar werd de Sovjet-Unie (USSR) officieel ontbonden?",
      "type": "multiple-choice",
      "options": ["1991", "1989", "1990", "1992"],
      "answer": "1991",
      "timeLimit": 20,
      "doublePoints": false
    },
    {
      "id": "q_bonus",
      "question": "Hoe heette de politiek van 'openheid' die Gorbatsjov introduceerde in de jaren 80?",
      "type": "multiple-choice",
      "options": ["Glasnost", "Perestrojka", "Demokratizatsiya", "Uskoreniye"],
      "answer": "Glasnost",
      "timeLimit": 25,
      "doublePoints": true
    }
  ]
}
