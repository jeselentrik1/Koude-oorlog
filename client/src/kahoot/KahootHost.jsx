import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SNTPClient } from './sntp';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, Star, Play, Check, ChevronRight } from 'lucide-react';
import { useAssetCache } from '../components/AssetContext';
import coldWarBg from '../assets/cold_war.jpeg';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const STATES = {
  START: 'START',
  COUNTDOWN: 'COUNTDOWN',
  QUESTION: 'QUESTION',
  RESULTS: 'RESULTS', // showing bar charts
  LEADERBOARD: 'LEADERBOARD',
  FINAL: 'FINAL'
};

export default function KahootHost({ questionId, isLobby, onComplete }) {
  const { getAssetUrl } = useAssetCache();
  const [socket, setSocket] = useState(null);
  const [sntp, setSntp] = useState(null);
  const [gameState, setGameState] = useState(STATES.START);
  const [password, setPassword] = useState('');
  const [sid, setSid] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerCount, setPlayerCount] = useState({ count: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [oldLeaderboard, setOldLeaderboard] = useState([]);
  const [answerDistribution, setAnswerDistribution] = useState({});
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // To handle the two-step leaderboard animation
  const [showNewLeaderboard, setShowNewLeaderboard] = useState(false);

  useEffect(() => {
    let timer;
    if ((gameState === STATES.COUNTDOWN || gameState === STATES.QUESTION) && sntp && startTime) {
      const updateTimers = () => {
        const serverNow = sntp.now();
        
        if (gameState === STATES.COUNTDOWN) {
          const remaining = Math.max(0, startTime - serverNow);
          setCountdown(Math.ceil(remaining / 1000));
          // State transition is handled by server event now, or we can force it:
          if (remaining <= 0 && gameState === STATES.COUNTDOWN) {
            setGameState(STATES.QUESTION);
          }
        } else if (gameState === STATES.QUESTION && currentQuestion) {
          const endTime = startTime + (currentQuestion.timeLimit || 20) * 1000;
          const remaining = Math.max(0, endTime - serverNow);
          setTimeLeft(remaining);
        }
        
        timer = requestAnimationFrame(updateTimers);
      };
      timer = requestAnimationFrame(updateTimers);
    }
    return () => cancelAnimationFrame(timer);
  }, [gameState, sntp, startTime, currentQuestion]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    const newSntp = new SNTPClient(newSocket);
    setSntp(newSntp);
    newSntp.startSync(1000);

    newSocket.on('host:reconnected', (data) => {
      setSid(data.sid);
      setQuestions(data.questions);
      setPlayerCount(data.playerCount);
      setError('');
      
      // If we are in lobby mode, skip it and go to presentation
      if (isLobby) {
        onComplete();
      } else if (questionId) {
        // Find the question
        const q = data.questions.find(q => q.id === questionId);
        setCurrentQuestion(q);
        
        // Check if question is already active
        if (data.currentState === 'COUNTDOWN' || data.currentState === 'QUESTION') {
           setGameState(STATES[data.currentState]);
           setStartTime(data.startTime);
        } else {
           // Start this question
           newSocket.emit('host:start-question', { sid: data.sid, questionId });
        }
      }
    });

    newSocket.on('connect', () => {
      const storedSid = localStorage.getItem('kahoot_host_sid');
      if (storedSid) {
        newSocket.emit('host:reconnect', { sid: storedSid });
      }
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
      if (data.top5) {
        setOldLeaderboard(leaderboard.length > 0 ? leaderboard : data.top5.map(p => ({...p, score: p.score - (p.lastPoints || 0)})));
        setLeaderboard(data.top5);
        setAnswerDistribution(data.answerDistribution || {});
      } else {
        setOldLeaderboard(leaderboard);
        setLeaderboard(data);
      }
      setGameState(STATES.RESULTS);
    });

    newSocket.on('quiz:final-leaderboard', (lb) => {
      setLeaderboard(lb);
      setGameState(STATES.FINAL);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      if (['Session expired', 'Invalid session'].includes(message)) {
        localStorage.removeItem('kahoot_host_sid');
        setGameState(STATES.START);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [questionId, isLobby]);

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
      
      if (isLobby) {
        onComplete();
      } else if (questionId) {
        const q = questions.find(q => q.id === questionId);
        setCurrentQuestion(q);
        socket.emit('host:start-question', { sid: data.sid, questionId });
      }
      setError('');
    } catch (err) {
      setError('Failed to start quiz');
    }
  };

  const handleNextFromResults = () => {
    setGameState(STATES.LEADERBOARD);
    setShowNewLeaderboard(false);
    // Trigger animation after a short delay
    setTimeout(() => {
      setShowNewLeaderboard(true);
    }, 1500);
  };

  const handleContinuePresenting = () => {
    socket.emit('host:set-idle', { sid });
    onComplete();
  };

  // UI Renderers
  return (
    <div className="w-full h-full bg-slate-950 text-white font-sans flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={getAssetUrl(coldWarBg)} 
          alt="" 
          className="w-full h-full object-cover scale-110 blur-xl opacity-30" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/80" />
      </div>

      <div className="relative z-10 w-full max-w-6xl p-8 flex flex-col items-center justify-center min-h-screen">
        
        {error && (
          <div className="absolute top-8 bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg backdrop-blur-md">
            {error}
          </div>
        )}

        {gameState === STATES.START && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 p-12 rounded-3xl border border-white/10 backdrop-blur-2xl max-w-md w-full text-center shadow-2xl"
          >
            <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">Host Sessie</h2>
            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-8">Maak een nieuwe quiz sessie aan</p>
            <input 
              type="password" 
              placeholder="WACHTWOORD" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-xl mb-6 text-center text-xl tracking-widest focus:border-white/30 outline-none transition-colors uppercase font-black"
            />
            <button 
              onClick={startQuiz}
              className="w-full bg-white text-black hover:bg-slate-100 py-4 rounded-xl font-black tracking-widest text-lg transition-transform active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              START SESSIE
            </button>
          </motion.div>
        )}

        {gameState === STATES.COUNTDOWN && currentQuestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center"
          >
            <h2 className="text-6xl font-black mb-16 leading-tight max-w-4xl mx-auto uppercase tracking-tighter">{currentQuestion.question}</h2>
            
            <div className="w-full max-w-3xl mx-auto h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
            <div className="mt-12 text-8xl font-black text-white/90 tracking-tighter">{countdown}</div>
          </motion.div>
        )}

        {gameState === STATES.QUESTION && currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col justify-between"
          >
            <div className="text-center pt-12">
              <h2 className="text-6xl font-black mb-12 leading-tight max-w-5xl mx-auto uppercase tracking-tighter">{currentQuestion.question}</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8 mb-12">
              <div className="grid grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
                {currentQuestion.options.map((opt, idx) => {
                  const colors = [
                    'bg-red-500/80 border-red-500/50', 
                    'bg-blue-500/80 border-blue-500/50', 
                    'bg-amber-500/80 border-amber-500/50', 
                    'bg-emerald-500/80 border-emerald-500/50'
                  ];
                  const shapes = ['▲', '◆', '●', '■'];
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${colors[idx]} rounded-2xl p-10 flex items-center gap-8 border backdrop-blur-md shadow-2xl relative overflow-hidden`}
                    >
                      <div className="text-5xl text-white/40 font-black">{shapes[idx]}</div>
                      <span className="text-3xl font-black uppercase tracking-tight">{opt}</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-end pb-8 px-12">
              <div className="flex flex-col items-center">
                <div className="text-7xl font-black bg-white/5 w-40 h-40 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-xl shadow-2xl">
                  {Math.ceil(timeLeft / 1000)}
                </div>
              </div>
              <div className="flex flex-col items-center bg-white/5 px-12 py-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <span className="text-xs font-black text-white/40 mb-2 uppercase tracking-[0.3em]">Antwoorden</span>
                <div className="text-7xl font-black tracking-tighter">{playerCount.count}</div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === STATES.RESULTS && currentQuestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center flex flex-col items-center justify-center h-full"
          >
            <h2 className="text-5xl font-black mb-16 max-w-4xl uppercase tracking-tighter">{currentQuestion.question}</h2>
            
            <div className="flex justify-center items-end h-[500px] gap-8 mb-16 w-full max-w-5xl">
              {currentQuestion.options.map((opt, idx) => {
                const count = answerDistribution[opt] || 0;
                const total = Math.max(1, Object.values(answerDistribution).reduce((a, b) => a + b, 0));
                const heightPercentage = Math.max(5, (count / total) * 100);
                const isCorrect = currentQuestion.answer === opt;
                const colors = [
                  'bg-red-500/60 border-red-500/30', 
                  'bg-blue-500/60 border-blue-500/30', 
                  'bg-amber-500/60 border-amber-500/30', 
                  'bg-emerald-500/60 border-emerald-500/30'
                ];
                const shapes = ['▲', '◆', '●', '■'];
                
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full w-40 gap-6">
                    <span className="text-4xl font-black tracking-tighter">{count}</span>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                      className={`w-full rounded-2xl relative border backdrop-blur-sm shadow-2xl ${isCorrect ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] border-emerald-400' : 'bg-white/5 border-white/10'}`}
                    >
                      {isCorrect && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                          <Check className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                        </div>
                      )}
                    </motion.div>
                    <div className={`w-full h-16 rounded-2xl border flex items-center justify-center text-3xl ${colors[idx]}`}>
                      {shapes[idx]}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleNextFromResults}
              className="bg-white text-black hover:bg-slate-100 px-16 py-6 rounded-2xl font-black text-2xl flex items-center gap-6 transition-transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] uppercase tracking-tighter"
            >
              Volgende <ChevronRight className="w-10 h-10" />
            </button>
          </motion.div>
        )}

        {gameState === STATES.LEADERBOARD && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl"
          >
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-white/40 uppercase tracking-[0.3em] text-xs font-black block mb-2">Huidige Stand</span>
                <h2 className="text-7xl font-black tracking-tighter uppercase">Leaderboard</h2>
              </div>
              <button 
                onClick={handleContinuePresenting}
                className="bg-white/5 hover:bg-white/10 px-10 py-5 rounded-2xl font-black border border-white/10 backdrop-blur-xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 uppercase tracking-tight"
              >
                Doorgaan <Play className="w-6 h-6 fill-current" />
              </button>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {[...leaderboard]
                  .sort((a, b) => {
                    const aOld = oldLeaderboard.find(p => p.name === a.name)?.score || 0;
                    const bOld = oldLeaderboard.find(p => p.name === b.name)?.score || 0;
                    return showNewLeaderboard ? b.score - a.score : bOld - aOld;
                  })
                  .map((player, idx) => {
                    const oldPlayer = oldLeaderboard.find(p => p.name === player.name) || { score: 0 };
                    const scoreToDisplay = showNewLeaderboard ? player.score : oldPlayer.score;
                    
                    return (
                      <motion.div 
                        key={player.name}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 border border-white/10 p-8 rounded-3xl flex justify-between items-center backdrop-blur-xl shadow-2xl group hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-10">
                          <span className="text-4xl font-black text-white/20 w-12 tracking-tighter">{idx + 1}</span>
                          <span className="text-4xl font-black uppercase tracking-tight">{player.name}</span>
                        </div>
                        <div className="text-5xl font-black text-white tracking-tighter font-mono">
                          <NumberCounter value={scoreToDisplay} />
                        </div>
                      </motion.div>
                    );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper to animate numbers
function NumberCounter({ value }) {
  const [display, setDisplay] = useState(value);
  
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    
    const duration = 1000;
    const startTime = performance.now();
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      
      setDisplay(current);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplay(end);
      }
    };
    
    requestAnimationFrame(update);
  }, [value]);
  
  return <>{display}</>;
}
