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
