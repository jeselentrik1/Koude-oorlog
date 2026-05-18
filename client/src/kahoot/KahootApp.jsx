import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SNTPClient } from './sntp';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { User, CheckCircle2, XCircle, Trophy, Triangle, Diamond, Circle, Square, Zap } from 'lucide-react';
import { useAssetCache } from '../components/AssetContext';
import coldWarBg from '../assets/cold_war.jpeg';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const STATES = {
  JOIN: 'JOIN',
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  QUESTION: 'QUESTION',
  ANSWERED: 'ANSWERED',
  QUESTION_RESULT: 'QUESTION_RESULT',
  FINAL_RESULT: 'FINAL_RESULT'
};

const OPTION_SHAPES = [Triangle, Diamond, Circle, Square];
const OPTION_COLORS = [
  'bg-red-800 active:bg-red-700 border-red-600 text-white',
  'bg-blue-900 active:bg-blue-800 border-blue-700 text-white',
  'bg-amber-700 active:bg-amber-600 border-amber-500 text-white',
  'bg-emerald-900 active:bg-emerald-800 border-emerald-700 text-white',
];

export default function KahootApp({ navigate }) {
  const { getAssetUrl } = useAssetCache();
  const [socket, setSocket] = useState(null);
  const [sntp, setSntp] = useState(null);
  
  const [gameState, setGameState] = useState(STATES.JOIN);
  const [sid, setSid] = useState('');
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');
  
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const [questionResult, setQuestionResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState === STATES.QUESTION_RESULT && questionResult) {
      const prevScore = questionResult.totalScore - questionResult.pointsGained;
      setDisplayedScore(prevScore);

      const timeout = setTimeout(() => {
        animate(prevScore, questionResult.totalScore, {
          duration: 1,
          onUpdate: (latest) => setDisplayedScore(Math.floor(latest)),
          ease: "easeOut"
        });
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [gameState, questionResult]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    const newSntp = new SNTPClient(newSocket);
    setSntp(newSntp);
    newSntp.startSync(1000); // sync every second

    newSocket.on('connect', () => {
      console.log('Connected to server');
      // Try to reconnect if we have stored session
      const stored = localStorage.getItem('kahoot_session');
      if (stored) {
        try {
          const { sid, playerId } = JSON.parse(stored);
          newSocket.emit('player:reconnect', { sid, playerId });
        } catch (e) {
          localStorage.removeItem('kahoot_session');
        }
      }
    });

    newSocket.on('quiz:started', ({ sid: newSid }) => {
      // If we were sitting on a previous quiz's final-result screen (or anywhere with a stale
      // session), wipe the local state so the player can rejoin fresh under a new name.
      setSid((prevSid) => {
        if (prevSid && prevSid !== newSid) {
          setName('');
          setPlayerId('');
          setScore(0);
          setDisplayedScore(0);
          setQuestion(null);
          setQuestionResult(null);
          setFinalResult(null);
          setSelectedAnswer(null);
          setGameState(STATES.JOIN);
          localStorage.removeItem('kahoot_session');
        }
        return newSid;
      });
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      if (['Session expired', 'Player not found', 'Invalid session'].includes(message)) {
        localStorage.removeItem('kahoot_session');
      }
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('player:registered', ({ name, sid, playerId }) => {
      setGameState(STATES.LOBBY);
      setError('');
      setPlayerId(playerId);
      // Save to localStorage for reconnection
      localStorage.setItem('kahoot_session', JSON.stringify({ sid, name, playerId }));
    });

    newSocket.on('player:reconnected', ({ name, sid, score, gameState: serverGameState }) => {
      setGameState(STATES[serverGameState] || STATES.LOBBY);
      setSid(sid);
      setName(name);
      setScore(score);
      setDisplayedScore(score);
      setError('');
      console.log('Reconnected successfully');
    });

    newSocket.on('question:start', (q) => {
      setQuestion(q);
      setSelectedAnswer(null);
      setQuestionResult(null);
      setGameState(STATES.COUNTDOWN);
    });

    newSocket.on('answer:ack', () => {
      setGameState(STATES.ANSWERED);
    });

    newSocket.on('question:ended', (res) => {
      setQuestionResult(res);
      setGameState(STATES.QUESTION_RESULT);
      setScore(res.totalScore);
    });

    newSocket.on('player:idle', () => {
      setGameState(STATES.LOBBY);
      setQuestion(null);
      setQuestionResult(null);
    });

    newSocket.on('quiz:results', (res) => {
      setFinalResult(res);
      setGameState(STATES.FINAL_RESULT);
      setScore(res.score);
      // Clear session on quiz end
      localStorage.removeItem('kahoot_session');
    });

    return () => {
      newSntp.stopSync();
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer;
    if ((gameState === STATES.QUESTION || gameState === STATES.COUNTDOWN) && question && sntp) {
      const updateTimer = () => {
        const serverNow = sntp.now();
        
        if (gameState === STATES.COUNTDOWN) {
          const countdownRemaining = Math.max(0, question.startTime - serverNow);
          if (countdownRemaining <= 0) {
            setGameState(STATES.QUESTION);
          }
        }

        const endTime = question.startTime + (question.timeLimit * 1000);
        const remaining = Math.max(0, endTime - serverNow);
        setTimeLeft(remaining);
        
        if (remaining > 0 || (gameState === STATES.COUNTDOWN && question.startTime > serverNow)) {
          timer = requestAnimationFrame(updateTimer);
        }
      };
      timer = requestAnimationFrame(updateTimer);
    }
    return () => cancelAnimationFrame(timer);
  }, [gameState, question, sntp]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!sid || !name) return;
    socket.emit('player:join', { sid, name });
  };

  const handleAnswer = (answer) => {
    if (gameState !== STATES.QUESTION || !sntp) return;
    
    setSelectedAnswer(answer);
    socket.emit('player:answer', {
      sid,
      questionId: question.id,
      answer,
      timestamp: sntp.now()
    });
  };

  const isRoundActive =
    question &&
    (gameState === STATES.COUNTDOWN || gameState === STATES.QUESTION);

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] bg-cover bg-center relative text-white font-sans overflow-hidden overscroll-none touch-manipulation"
      style={{ backgroundImage: `url(${getAssetUrl(coldWarBg)})` }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />
      
      <div
        className={`relative z-10 flex flex-col w-full mx-auto min-h-0 ${
          isRoundActive
            ? 'h-full max-w-lg px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            : 'min-h-[100dvh] items-center justify-center p-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]'
        }`}
      >
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed left-1/2 -translate-x-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 max-w-[calc(100%-2rem)] bg-red-900/90 text-red-100 px-4 sm:px-6 py-3 rounded border border-red-500/50 shadow-2xl flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              <span className="font-medium tracking-wide uppercase">{error}</span>
            </motion.div>
          )}

          {gameState === STATES.JOIN && (
            <motion.div
              key="join"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900/80 p-6 sm:p-8 rounded-xl border border-zinc-700/50 shadow-2xl backdrop-blur-lg"
            >
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">Koude Oorlog Quiz</h1>
                <div className="h-1 w-16 bg-red-700 mx-auto mb-6 shadow-lg" />
                <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">
                  {!sid ? "Wachten tot de quiz begint..." : "Vul je naam in om mee te doen"}
                </p>
              </div>

              {sid ? (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="NAAM" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-950/50 border-2 border-white/10 rounded px-10 py-3 sm:py-4 text-center font-bold text-lg sm:text-xl tracking-wide uppercase focus:outline-none focus:border-red-700 focus:bg-black/80 transition-all"
                        required
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 sm:py-4 rounded text-lg sm:text-xl uppercase tracking-widest transition-colors border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                  >
                    Meedoen
                  </button>
                </form>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                </div>
              )}
            </motion.div>
          )}

          {isRoundActive && (
            <motion.div
              key={`round-${question.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 min-h-0 w-full"
            >
              {gameState === STATES.COUNTDOWN ? (
                <motion.div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 flex justify-center pt-2 sm:pt-4">
                    {question.doublePoints && <DoublePointsBadge size="md" />}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 text-center">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.08, 0.25, 0.08],
                        }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-48 h-48 sm:w-72 sm:h-72 rounded-full border-[12px] sm:border-[20px] border-red-900/20"
                      />
                    </div>
                    <div className="h-28 sm:h-40 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={Math.ceil(Math.max(0, question.startTime - (sntp?.now() || 0)) / 1000)}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.3, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className="text-[5.5rem] sm:text-[8rem] md:text-[10rem] font-black text-red-700 drop-shadow-[0_0_50px_rgba(185,28,28,0.8)] font-mono leading-none tabular-nums"
                        >
                          {Math.ceil(Math.max(0, question.startTime - (sntp?.now() || 0)) / 1000)}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <p className="mt-4 sm:mt-6 text-zinc-500 uppercase tracking-[0.35em] sm:tracking-[0.5em] font-black text-sm sm:text-xl">
                      Maak je klaar
                    </p>
                    <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4">
                      <div className="h-[2px] w-8 sm:w-12 bg-red-900/50" />
                      <div className="text-red-900 text-sm sm:text-base">★</div>
                      <div className="h-[2px] w-8 sm:w-12 bg-red-900/50" />
                    </div>
                  </div>
                  <div
                    className="shrink-0 grid grid-cols-1 gap-2 sm:gap-3 min-h-[min(46dvh,22rem)] sm:min-h-[min(40dvh,20rem)] opacity-0 pointer-events-none"
                    aria-hidden
                  >
                    {question.options.map((_, idx) => (
                      <div key={idx} className="min-h-[3.25rem] sm:min-h-[3.75rem] rounded-xl" />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  <header className="shrink-0 text-center mb-4 sm:mb-6">
                    {question.doublePoints && (
                      <div className="mb-3 sm:mb-4 flex justify-center px-1">
                        <DoublePointsBadge size="md" />
                      </div>
                    )}
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] text-white uppercase tracking-tighter px-1">
                      {question.question}
                    </h2>
                  </header>

                  <div className="shrink-0 w-full mb-3 sm:mb-4">
                    <div className="flex items-center justify-between font-bold text-slate-400 mb-1.5 tracking-wide uppercase text-[10px] sm:text-xs">
                      <span>Resterende Tijd</span>
                      <span className="font-black text-red-600 tabular-nums">{(timeLeft / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div
                        className="h-full bg-red-700 shadow-[0_0_10px_rgba(185,28,28,0.5)]"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / (question.timeLimit * 1000)) * 100}%` }}
                        transition={{ ease: 'linear', duration: 0.1 }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-[min(46dvh,22rem)] sm:min-h-[min(40dvh,20rem)] grid grid-cols-1 gap-2 sm:gap-3 grid-rows-4 auto-rows-fr">
                    {question.options.map((opt, idx) => {
                      const ShapeIcon = OPTION_SHAPES[idx % 4];
                      const isSelected = selectedAnswer === opt;
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAnswer(opt)}
                          className={`relative min-h-[3.25rem] sm:min-h-[3.75rem] px-3 sm:px-5 py-3 rounded-xl border-2 ${OPTION_COLORS[idx % 4]} text-sm sm:text-lg font-bold shadow-xl overflow-hidden flex items-center gap-2 sm:gap-3 ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''
                          }`}
                        >
                          <ShapeIcon className="w-7 h-7 sm:w-9 sm:h-9 opacity-90 shrink-0" fill="currentColor" />
                          <span className="relative z-10 flex-1 text-left sm:text-center uppercase tracking-tight font-black leading-tight line-clamp-3">
                            {opt}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {gameState === STATES.LOBBY && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full max-w-sm"
            >
              <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50" />
                
                <div className="mb-8">
                  <div className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-black mb-1">Speler</div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">{name}</h2>
                </div>

                <div className="mb-8 sm:mb-12">
                  <div className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-black mb-1">Totaal Score</div>
                  <div className="text-5xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    {score}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-zinc-500">
                  <div className="flex gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-red-600" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-red-600" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-red-600" 
                    />
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest">Wachten op vraag</span>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === STATES.ANSWERED && question && (
            <motion.div
              key={`answered-${question.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center w-full max-w-sm"
            >
              <div className="bg-zinc-900/80 p-6 sm:p-10 rounded-2xl border border-zinc-700/50 backdrop-blur-md">
                <CheckCircle2 className="w-16 h-16 sm:w-24 sm:h-24 text-zinc-500 mx-auto mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-3xl font-black tracking-tighter uppercase mb-2 text-zinc-300">Antwoord Ontvangen</h2>
                <p className="text-slate-500 font-bold tracking-wide uppercase">Wachten op andere spelers...</p>
              </div>
            </motion.div>
          )}

          {gameState === STATES.QUESTION_RESULT && questionResult && question && (
            <motion.div
              key={`q-result-${question.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-md"
            >
              <div className={`p-6 sm:p-10 rounded-3xl text-center backdrop-blur-xl shadow-2xl flex flex-col items-center border-t border-white/20 ${
                questionResult.isCorrect 
                  ? 'bg-emerald-600/90 shadow-[0_0_50px_rgba(16,185,129,0.4)]' 
                  : 'bg-red-600/90 shadow-[0_0_50px_rgba(220,38,38,0.4)]'
              }`}>
                {questionResult.isCorrect ? (
                  <CheckCircle2 className="w-20 h-20 sm:w-32 sm:h-32 text-white mb-4 sm:mb-6 drop-shadow-lg" />
                ) : (
                  <XCircle className="w-20 h-20 sm:w-32 sm:h-32 text-white mb-4 sm:mb-6 drop-shadow-lg" />
                )}
                
                <div className="text-5xl sm:text-7xl font-black tracking-tighter mb-3 drop-shadow-lg text-white">
                  +{questionResult.pointsGained}
                </div>

                {question.doublePoints && (
                  <div className="mb-6">
                    <DoublePointsBadge size="sm" />
                  </div>
                )}
                
                <div className="w-full pt-4 mt-4 border-t border-white/10">
                  <div className="text-zinc-200/60 uppercase tracking-widest text-[10px] font-bold mb-1">Totaal</div>
                  <div className="text-5xl font-black tracking-tighter text-white">
                    {displayedScore}
                  </div>
                </div>

                <div className="mt-8 sm:mt-12 text-white/80">
                  <div className="text-3xl font-black tracking-tighter opacity-40 uppercase text-xs tracking-widest mb-1">Positie</div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tighter">
                    #{questionResult.rank}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === STATES.FINAL_RESULT && finalResult && (
            <motion.div
              key="final-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center w-full max-w-md"
            >
              <div className="bg-zinc-900/90 p-6 sm:p-10 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-lg">
                <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-amber-500 mx-auto mb-4 sm:mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-2 text-white">Quiz Voltooid</h1>
                <p className="text-slate-400 font-bold tracking-wide uppercase mb-8">Bekijk het scherm voor de einduitslag</p>
                
                <div className="bg-black/60 rounded-xl p-6 mb-6 border border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Eindklassement</p>
                  <div className="text-5xl sm:text-6xl font-black tracking-tighter text-white">
                    #{finalResult.rank}
                  </div>
                  <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-wide">van de {finalResult.totalPlayers} spelers</p>
                </div>
                
                <div className="bg-black/60 rounded-xl p-6 border border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Eindscore</p>
                  <div className="text-4xl font-black tracking-tighter text-red-700 drop-shadow-[0_0_10px_rgba(185,28,28,0.5)]">
                    {finalResult.score}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Double-points indicator ----------
// Same visual concept as the host's badge so players instantly recognise it when they look
// up at the projector and back down at their phone. Gold gradient pill, halo + shimmer.
function DoublePointsBadge({ size = 'md' }) {
  const sizes = {
    sm: { padding: 'px-3 py-1.5', text: 'text-[10px]', icon: 'w-3.5 h-3.5', gap: 'gap-1.5', tracking: 'tracking-[0.18em]' },
    md: { padding: 'px-5 py-2.5', text: 'text-sm',     icon: 'w-4 h-4',     gap: 'gap-2',   tracking: 'tracking-[0.22em]' },
    lg: { padding: 'px-7 py-3.5', text: 'text-lg',     icon: 'w-6 h-6',     gap: 'gap-3',   tracking: 'tracking-[0.25em]' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative inline-flex max-w-full"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-amber-400/45 blur-2xl"
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className={`relative inline-flex items-center ${s.gap} ${s.padding} rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 font-black uppercase ${s.text} ${s.tracking} border-2 border-amber-100/80 shadow-[0_8px_30px_rgba(245,158,11,0.55)] overflow-hidden max-w-full`}
      >
        <motion.div
          aria-hidden
          className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12"
          animate={{ left: ['-50%', '160%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Zap className={`${s.icon} fill-amber-500 stroke-amber-900 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] relative`} strokeWidth={2.5} />
        <span className="relative leading-none">
          <span className="font-mono mr-1.5">&times;2</span>Dubbele Punten
        </span>
        <Zap className={`${s.icon} fill-amber-500 stroke-amber-900 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] relative`} strokeWidth={2.5} />
      </div>
    </motion.div>
  );
}
