import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../components/SocketContext';
import { SNTPClient } from './sntp';

const KahootHostContext = createContext(null);

export const STATES = {
  LOADING: 'LOADING',
  START: 'START',
  COUNTDOWN: 'COUNTDOWN',
  QUESTION: 'QUESTION',
  RESULTS: 'RESULTS',
  LEADERBOARD: 'LEADERBOARD',
  PODIUM: 'PODIUM',
  FINAL: 'FINAL'
};

export function KahootHostProvider({ children }) {
  const { socket } = useSocket();
  const [sntp, setSntp] = useState(null);
  const [gameState, setGameState] = useState(STATES.START);
  const [sid, setSid] = useState('');
  const [questions, setQuestions] = useState([]);
  const [playerCount, setPlayerCount] = useState({ count: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [oldLeaderboard, setOldLeaderboard] = useState([]);
  const [answerDistribution, setAnswerDistribution] = useState({});
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const newSntp = new SNTPClient(socket);
    setSntp(newSntp);
    newSntp.startSync(1000);

    const tryReconnect = () => {
      const storedSid = localStorage.getItem('kahoot_host_sid');
      if (storedSid) {
        setGameState(STATES.LOADING);
        socket.emit('host:reconnect', { sid: storedSid });
      }
    };

    const handleReconnected = (data) => {
      setSid(data.sid);
      setQuestions(data.questions);
      setPlayerCount(data.playerCount);
      setError('');

      // Mid-question reconnects must use the *exact* shuffled options the players saw,
      // otherwise the host renders option colors/positions out of sync with the players.
      if (data.activeQuestion) {
        setCurrentQuestion(data.activeQuestion);
      }
      
      if (data.currentState && STATES[data.currentState]) {
        setGameState(STATES[data.currentState]);
        if (data.startTime) setStartTime(data.startTime);
      } else {
        setGameState(STATES.START);
      }
    };

    const handleQuestions = (qs) => {
      setQuestions(qs);
    };

    const handleJoinSuccess = (data) => {
      setSid(data.sid);
      localStorage.setItem('kahoot_host_sid', data.sid);
      setGameState(STATES.START);
    };

    const handleQuestionStart = (data) => {
      // CRITICAL: replace currentQuestion with the server-shuffled options the players also
      // received, so option positions/colors/shapes match across host and player screens.
      setCurrentQuestion({
        id: data.id,
        question: data.question,
        options: data.options,
        answer: data.answer,
        timeLimit: data.timeLimit,
        isFinal: !!data.isFinal,
        doublePoints: !!data.doublePoints,
      });
      setStartTime(data.startTime);
      setGameState(STATES.COUNTDOWN);
      // Fresh question = fresh leaderboard animation state (needed for back-to-back questions).
      setOldLeaderboard([]);
      setAnswerDistribution({});
    };

    const handlePlayerAnswered = (data) => {
      setPlayerCount(data);
    };

    const handlePlayerJoined = (data) => {
      setPlayerCount(prev => ({ ...prev, total: data.count }));
    };

    const handleLeaderboard = (data) => {
      if (data.top5) {
        setOldLeaderboard(prev => prev.length > 0 ? prev : data.top5.map(p => ({...p, score: p.score - (p.lastPoints || 0)})));
        setLeaderboard(data.top5);
        setAnswerDistribution(data.answerDistribution || {});
      } else {
        setLeaderboard(data);
      }
      setGameState(STATES.RESULTS);
    };

    const handleFinalLeaderboard = (lb) => {
      // Update the leaderboard with the *complete* final standings (full list, not just top 5).
      // We don't force a state transition here — the active host UI is in charge of moving to
      // PODIUM / FINAL so we don't fight whatever animation is currently running.
      setLeaderboard(lb);
    };

    const handleError = ({ message }) => {
      setError(message);
      if (['Session expired', 'Invalid session'].includes(message)) {
        localStorage.removeItem('kahoot_host_sid');
        setGameState(STATES.START);
      }
    };

    socket.on('connect', tryReconnect);
    socket.on('host:reconnected', handleReconnected);
    socket.on('host:questions', handleQuestions);
    socket.on('host:join-success', handleJoinSuccess);
    socket.on('host:question-start', handleQuestionStart);
    socket.on('host:player-answered', handlePlayerAnswered);
    socket.on('host:player-joined', handlePlayerJoined);
    socket.on('question:leaderboard', handleLeaderboard);
    socket.on('quiz:final-leaderboard', handleFinalLeaderboard);
    socket.on('error', handleError);

    if (socket.connected) tryReconnect();

    return () => {
      newSntp.stopSync();
      socket.off('connect', tryReconnect);
      socket.off('host:reconnected', handleReconnected);
      socket.off('host:questions', handleQuestions);
      socket.off('host:join-success', handleJoinSuccess);
      socket.off('host:question-start', handleQuestionStart);
      socket.off('host:player-answered', handlePlayerAnswered);
      socket.off('host:player-joined', handlePlayerJoined);
      socket.off('question:leaderboard', handleLeaderboard);
      socket.off('quiz:final-leaderboard', handleFinalLeaderboard);
      socket.off('error', handleError);
    };
  }, [socket]);

  const startQuestion = (questionId) => {
    if (socket && sid) {
      socket.emit('host:start-question', { sid, questionId });
    }
  };

  const setIdle = () => {
    if (socket && sid) {
      socket.emit('host:set-idle', { sid });
    }
  };

  const endQuiz = () => {
    if (socket && sid) {
      socket.emit('host:end-quiz', { sid });
    }
    // Clear local host session so the next quiz starts fresh.
    localStorage.removeItem('kahoot_host_sid');
    setSid('');
  };

  const value = {
    socket,
    sntp,
    gameState,
    setGameState,
    sid,
    setSid,
    questions,
    playerCount,
    leaderboard,
    setLeaderboard,
    oldLeaderboard,
    setOldLeaderboard,
    answerDistribution,
    setAnswerDistribution,
    error,
    setError,
    startTime,
    setStartTime,
    currentQuestion,
    setCurrentQuestion,
    startQuestion,
    setIdle,
    endQuiz
  };

  return (
    <KahootHostContext.Provider value={value}>
      {children}
    </KahootHostContext.Provider>
  );
}

export function useKahootHost() {
  const context = useContext(KahootHostContext);
  if (!context) {
    throw new Error('useKahootHost must be used within a KahootHostProvider');
  }
  return context;
}
