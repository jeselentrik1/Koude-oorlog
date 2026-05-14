import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SNTPClient } from './sntp';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, Star } from 'lucide-react';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';

const STATES = {
  START: 'START',
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  QUESTION: 'QUESTION',
  LEADERBOARD: 'LEADERBOARD',
  FINAL: 'FINAL'
};

export default function KahootHostTest() {
  const [socket, setSocket] = useState(null);
  const [sntp, setSntp] = useState(null);
  const [gameState, setGameState] = useState(STATES.START);
  const [password, setPassword] = useState('change-this-password');
  const [sid, setSid] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [playerCount, setPlayerCount] = useState({ count: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [answerDistribution, setAnswerDistribution] = useState({});
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if ((gameState === STATES.COUNTDOWN || gameState === STATES.QUESTION) && sntp && startTime) {
      const updateTimers = () => {
        const serverNow = sntp.now();
        
        if (gameState === STATES.COUNTDOWN) {
          const remaining = Math.max(0, startTime - serverNow);
          setCountdown(Math.ceil(remaining / 1000));
          if (remaining <= 0) {
            setGameState(STATES.QUESTION);
          }
        } else if (gameState === STATES.QUESTION && currentQuestionIndex !== -1) {
          const question = questions[currentQuestionIndex];
          if (question) {
            const endTime = startTime + (question.timeLimit || 20) * 1000;
            const remaining = Math.max(0, endTime - serverNow);
            setTimeLeft(remaining);
          }
        }
        
        timer = requestAnimationFrame(updateTimers);
      };
      timer = requestAnimationFrame(updateTimers);
    }
    return () => cancelAnimationFrame(timer);
  }, [gameState, sntp, startTime, currentQuestionIndex, questions]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    const newSntp = new SNTPClient(newSocket);
    setSntp(newSntp);
    newSntp.startSync(1000);

    newSocket.on('host:reconnected', (data) => {
      setSid(data.sid);
      setQuestions(data.questions);
      setGameState(STATES[data.currentState] || STATES.LOBBY);
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setPlayerCount(data.playerCount);
      setStartTime(data.startTime || 0);
      setError('');
      console.log('Host reconnected successfully');
    });

    newSocket.on('connect', () => {
      console.log('Host connected to server');
      const storedSid = localStorage.getItem('kahoot_host_sid');
      if (storedSid) {
        newSocket.emit('host:reconnect', { sid: storedSid });
      }
    });

    newSocket.on('host:questions', (qs) => {
      setQuestions(qs);
    });

    newSocket.on('host:question-start', (data) => {
      setStartTime(data.startTime);
      setGameState(STATES.COUNTDOWN);
    });

    newSocket.on('host:player-answered', (data) => {
      setPlayerCount(data);
    });

    newSocket.on('host:player-joined', (data) => {
      setPlayerCount(prev => ({ ...prev, total: data.count }));
    });

    newSocket.on('question:leaderboard', (data) => {
      // Handle both old and new format for safety
      if (data.top5) {
        setLeaderboard(data.top5);
        setAnswerDistribution(data.answerDistribution || {});
      } else {
        setLeaderboard(data);
      }
      setGameState(STATES.LEADERBOARD);
    });

    newSocket.on('quiz:final-leaderboard', (lb) => {
      setLeaderboard(lb);
      setGameState(STATES.FINAL);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      if (['Session expired', 'Invalid session'].includes(message)) {
        localStorage.removeItem('kahoot_host_sid');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startQuiz = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/quiz/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setSid(data.sid);
      socket.emit('host:join', { sid: data.sid });
      localStorage.setItem('kahoot_host_sid', data.sid);
      setGameState(STATES.LOBBY);
      setError('');
    } catch (err) {
      setError('Failed to start quiz');
    }
  };

  const startNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const question = questions[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      setPlayerCount({ count: 0, total: playerCount.total }); // Reset for next question
      socket.emit('host:start-question', { sid, questionId: question.id });
      // We wait for host:question-start from server to set COUNTDOWN state
    } else {
      endQuiz();
    }
  };

  const setIdle = () => {
    socket.emit('host:set-idle', { sid });
    setGameState(STATES.LOBBY);
  };

  const endQuiz = () => {
    socket.emit('host:end-quiz', { sid });
    localStorage.removeItem('kahoot_host_sid');
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-8">Kahoot Host Test Panel</h1>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {gameState === STATES.START && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md">
          <h2 className="text-xl mb-4">Start New Session</h2>
          <input 
            type="password" 
            placeholder="Quiz Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 p-2 rounded mb-4"
          />
          <button 
            onClick={startQuiz}
            className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold"
          >
            Create Session
          </button>
        </div>
      )}

      {sid && (
        <div className="mb-8 p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl backdrop-blur-sm flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest block mb-1">Session ID</span>
              <span className="font-mono text-2xl text-blue-100">{sid}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest block mb-1">Players Joined</span>
              <span className="text-3xl font-black text-blue-400">{playerCount.total}</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {gameState === STATES.LOBBY && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Lobby</h2>
            <p className="text-slate-400 mb-6">Waiting for players to join. Click below to start the first question.</p>
            <button 
              onClick={startNextQuestion}
              className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold text-lg"
            >
              Start Quiz (Question 1)
            </button>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Questions ({questions.length})</h3>
            <div className="grid gap-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                  <span className="text-slate-500 mr-2">{idx + 1}.</span> {q.question}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === STATES.COUNTDOWN && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 p-12 rounded-lg border border-slate-700 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-96 h-96 rounded-full border-[20px] border-blue-500" 
            />
          </div>
          
          <h2 className="text-slate-400 uppercase tracking-[0.3em] font-black mb-8">Volgende Vraag</h2>
          
          <div className="h-48 flex items-center justify-center mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.2, opacity: 0, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="text-[10rem] font-black text-blue-500 font-mono leading-none drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              >
                {countdown}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 text-slate-600">
            <div className="h-[2px] w-12 bg-slate-700" />
            <Star className="w-6 h-6 fill-current" />
            <div className="h-[2px] w-12 bg-slate-700" />
          </div>
          
          <p className="text-slate-500 italic mt-8 font-bold tracking-wide uppercase text-sm">Synchroniseren met alle spelers...</p>
        </motion.div>
      )}

      {gameState === STATES.QUESTION && (
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <div className="mb-8 flex justify-between items-center px-4">
            <h2 className="text-slate-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-black text-red-500 font-mono">{(timeLeft / 1000).toFixed(1)}s</span>
            </div>
          </div>
          
          <h3 className="text-4xl font-bold mb-12">{questions[currentQuestionIndex]?.question}</h3>
          
          <div className="flex justify-center items-center gap-12 mb-12">
            <div className="text-center">
              <span className="text-6xl font-black block">{playerCount.count}</span>
              <span className="text-slate-400 uppercase font-bold text-sm">Answers</span>
            </div>
            <div className="w-px h-24 bg-slate-700" />
            <div className="text-center">
              <span className="text-6xl font-black block">{playerCount.total}</span>
              <span className="text-slate-400 uppercase font-bold text-sm">Total Players</span>
            </div>
          </div>

          <p className="text-slate-500 italic mb-8">The question will end automatically when everyone has answered or the time limit is reached.</p>
        </div>
      )}

      {gameState === STATES.LEADERBOARD && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
              <h2 className="text-2xl font-bold mb-6 text-center">Antwoord Verdeling</h2>
              <div className="space-y-4">
                {Object.entries(answerDistribution).map(([option, count]) => {
                  const total = Object.values(answerDistribution).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  const isCorrect = questions[currentQuestionIndex]?.answer === option;
                  
                  return (
                    <div key={option} className="space-y-1">
                      <div className="flex justify-between text-sm font-bold">
                        <span className={isCorrect ? "text-green-400" : "text-slate-300"}>
                          {option} {isCorrect && "✓"}
                        </span>
                        <span>{count}</span>
                      </div>
                      <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className={`h-full transition-all duration-1000 ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
              <h2 className="text-2xl font-bold mb-6 text-center">Top 5 Spelers</h2>
              <div className="space-y-2">
                {leaderboard.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <span className="font-bold">{idx + 1}. {player.name}</span>
                    <span className="text-xl font-black text-blue-400">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={setIdle}
              className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-bold"
            >
              Back to Lobby
            </button>
            <button 
              onClick={startNextQuestion}
              className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold text-lg"
            >
              {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'End Quiz'}
            </button>
          </div>
        </div>
      )}

      {gameState === STATES.FINAL && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 p-12 rounded-lg border border-blue-500/50 shadow-2xl max-w-2xl mx-auto text-center relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          
          <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <h2 className="text-5xl font-black mb-2 text-blue-400 uppercase tracking-tighter">Final Results</h2>
          <div className="h-1 w-24 bg-blue-500 mx-auto mb-12 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          
          <div className="space-y-4 text-left max-w-md mx-auto mb-12">
            {leaderboard.map((player, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  idx === 0 ? 'bg-blue-600/20 border-blue-500 text-blue-100 scale-105 shadow-xl' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <span className="text-xl font-bold flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  {player.name}
                  {idx === 0 && <Star className="w-5 h-5 text-amber-500 fill-current" />}
                </span>
                <span className="text-2xl font-black">{player.score}</span>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            Start New Session
          </button>
        </motion.div>
      )}
    </div>
  );
}
