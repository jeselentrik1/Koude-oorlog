import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, Star, Play, Check, ChevronRight, Crown, Award, Medal, Sparkles, Flag, Zap } from 'lucide-react';
import { useAssetCache } from '../components/AssetContext';
import { useKahootHost, STATES } from './KahootHostContext';
import coldWarBg from '../assets/cold_war.jpeg';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

// Shared per-option color palette. Keep host and player in sync visually by indexing by
// position inside the *shuffled* options array (server guarantees host & player share that array).
const OPTION_COLORS = [
  {
    base: 'bg-red-500/80 border-red-500/50',
    bar: 'bg-red-500/70 border-red-400/40',
    swatch: 'bg-red-500',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.55)]',
    ring: 'ring-red-300',
    text: 'text-red-100',
  },
  {
    base: 'bg-blue-500/80 border-blue-500/50',
    bar: 'bg-blue-500/70 border-blue-400/40',
    swatch: 'bg-blue-500',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.55)]',
    ring: 'ring-blue-300',
    text: 'text-blue-100',
  },
  {
    base: 'bg-amber-500/80 border-amber-500/50',
    bar: 'bg-amber-500/70 border-amber-400/40',
    swatch: 'bg-amber-500',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.55)]',
    ring: 'ring-amber-300',
    text: 'text-amber-100',
  },
  {
    base: 'bg-emerald-500/80 border-emerald-500/50',
    bar: 'bg-emerald-500/70 border-emerald-400/40',
    swatch: 'bg-emerald-500',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.55)]',
    ring: 'ring-emerald-300',
    text: 'text-emerald-100',
  },
];
const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export default function KahootHost({ questionId, questionIds, isLobby, onComplete }) {
  const { getAssetUrl } = useAssetCache();
  const {
    socket,
    sntp,
    gameState,
    setGameState,
    sid,
    setSid,
    questions,
    playerCount,
    leaderboard,
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
  } = useKahootHost();

  const questionChain = useMemo(() => {
    if (Array.isArray(questionIds) && questionIds.length > 0) return questionIds.filter(Boolean);
    if (questionId) return [questionId];
    return [];
  }, [questionIds, questionId]);

  const [activeQuestionId, setActiveQuestionId] = useState(() => questionChain[0] ?? null);

  // If the parent ever swaps the question chain (e.g. interstitial replays), keep
  // activeQuestionId in sync with the new first id. Mounting a fresh KahootHost is the
  // common path, so this is a safety net for edge cases.
  useEffect(() => {
    const firstId = questionChain[0] ?? null;
    if (firstId && firstId !== activeQuestionId && !questionChain.includes(activeQuestionId)) {
      setActiveQuestionId(firstId);
    }
  }, [questionChain, activeQuestionId]);

  const [password, setPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [showNewLeaderboard, setShowNewLeaderboard] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Refs to read latest values from socket-driven callbacks without re-binding.
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Per-instance set of questionIds we've already sent `host:start-question` for.
  // This makes the start logic idempotent across re-renders, strict-mode double-effects,
  // and any leftover gameState from a previous interstitial — without ever skipping a start.
  const initiatedRef = useRef(new Set());

  // Single source of truth for "this instance is done — bail out to the slide deck once".
  const finishInterstitial = useCallback(() => {
    if (hasCompleted) return;
    // Reset game state to a neutral baseline so the next KahootHost instance that mounts
    // (next interstitial) doesn't render leftover LEADERBOARD/RESULTS while it waits for
    // the server to respond to its own host:start-question. LOADING shows a quiet spinner
    // rather than the password screen.
    setGameState(STATES.LOADING);
    setAnswerDistribution({});
    setOldLeaderboard([]);
    setShowNewLeaderboard(false);
    setHasCompleted(true);
    if (onCompleteRef.current) {
      try { onCompleteRef.current(); } catch { /* noop */ }
    }
  }, [hasCompleted, setGameState, setAnswerDistribution, setOldLeaderboard]);

  useEffect(() => {
    let timer;
    if ((gameState === STATES.COUNTDOWN || gameState === STATES.QUESTION) && sntp && startTime) {
      const updateTimers = () => {
        const serverNow = sntp.now();

        if (gameState === STATES.COUNTDOWN) {
          const remaining = Math.max(0, startTime - serverNow);
          setCountdown(Math.ceil(remaining / 1000));
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
  }, [gameState, sntp, startTime, currentQuestion, setGameState]);

  // Lobby auto-complete: once we've successfully joined a session, drop straight back to
  // the slide deck so the audience sees a "waiting for players" lobby UI on their phones
  // rather than the host's start screen blocking the presenter.
  useEffect(() => {
    if (!isLobby || hasCompleted) return;
    if (sid && socket) {
      finishInterstitial();
    }
  }, [isLobby, sid, socket, hasCompleted, finishInterstitial]);

  // Robust question start: when we have everything we need (socket, sid, questions, and a
  // target questionId), and we haven't already started this question for this instance,
  // wipe any stale RESULTS/LEADERBOARD UI and fire `host:start-question`. This is what
  // actually makes stacked-question interstitials work even after a previous quiz left
  // gameState on LEADERBOARD.
  useEffect(() => {
    if (isLobby || hasCompleted) return;
    if (!socket || !sid || !activeQuestionId) return;
    if (questions.length === 0) return;
    if (initiatedRef.current.has(activeQuestionId)) return;

    const alreadyRunningSame =
      currentQuestionRef.current?.id === activeQuestionId &&
      (gameStateRef.current === STATES.COUNTDOWN || gameStateRef.current === STATES.QUESTION);

    initiatedRef.current.add(activeQuestionId);

    if (alreadyRunningSame) return;

    const q = questions.find((item) => item.id === activeQuestionId);
    if (q) setCurrentQuestion(q);

    // Slam the UI to a neutral loading state right now so the user never sees a stale
    // leaderboard or results screen while we wait for `host:question-start` to come back.
    setAnswerDistribution({});
    setOldLeaderboard([]);
    setShowNewLeaderboard(false);
    setGameState(STATES.LOADING);
    startQuestion(activeQuestionId);
  }, [
    socket,
    sid,
    activeQuestionId,
    questions,
    isLobby,
    hasCompleted,
    setCurrentQuestion,
    setAnswerDistribution,
    setOldLeaderboard,
    setGameState,
    startQuestion,
  ]);

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
      if (socket) socket.emit('host:join', { sid: data.sid });
      localStorage.setItem('kahoot_host_sid', data.sid);
      setError('');
      // Don't start the question here — the useEffect above will do it on the next render
      // once `sid` propagates through context (the old direct call here silently failed
      // because the context's `startQuestion` closure still saw the empty sid).
    } catch (err) {
      setError('Quiz starten mislukt');
    }
  };

  const isFinalQuestion = !!(currentQuestion && currentQuestion.isFinal);

  const handleNextFromResults = useCallback(() => {
    if (gameStateRef.current !== STATES.RESULTS) return;
    if (isFinalQuestion) {
      // Final question: skip the regular leaderboard and head straight to the podium
      // animation. We also tell the server to wrap up the quiz right away so every player
      // socket session + name reservation is invalidated and the next quiz can start clean.
      setGameState(STATES.PODIUM);
      endQuiz();
      return;
    }

    setGameState(STATES.LEADERBOARD);
    setShowNewLeaderboard(false);
    setTimeout(() => {
      setShowNewLeaderboard(true);
    }, 1500);
  }, [isFinalQuestion, setGameState, endQuiz]);

  const handleContinuePresenting = useCallback(() => {
    if (gameStateRef.current !== STATES.LEADERBOARD) return;

    const idx = questionChain.indexOf(activeQuestionId);
    const nextId =
      idx >= 0 && idx < questionChain.length - 1 ? questionChain[idx + 1] : null;

    if (nextId) {
      // Switch to the next chained question. The start-question useEffect above will see
      // a new activeQuestionId, reset the UI, and emit `host:start-question` itself —
      // we just have to stage the data transitions cleanly.
      setShowNewLeaderboard(false);
      setOldLeaderboard([]);
      setAnswerDistribution({});
      setGameState(STATES.LOADING);
      const q = questions.find((item) => item.id === nextId);
      if (q) setCurrentQuestion(q);
      setActiveQuestionId(nextId);
      return;
    }

    setIdle();
    finishInterstitial();
  }, [
    activeQuestionId,
    questionChain,
    questions,
    setIdle,
    setCurrentQuestion,
    setOldLeaderboard,
    setAnswerDistribution,
    setGameState,
    finishInterstitial,
  ]);

  const handleFinishFromPodium = useCallback(() => {
    // host:end-quiz already fired when entering podium; this just leaves the interstitial.
    finishInterstitial();
  }, [finishInterstitial]);

  // Remote control from the presenter window (`/present/notes`). Pressing next/space on
  // the second screen should drive the kahoot through its terminal states the same way
  // clicking the on-screen button does. We intentionally ignore nav during COUNTDOWN /
  // QUESTION (timer-driven) and START (needs password), and we never advance the slide
  // deck from here — the deck's own listener handles that once `activeInterstitial` clears.
  useEffect(() => {
    if (!socket) return;
    const onNav = ({ direction }) => {
      if (direction !== 'next') return;
      const state = gameStateRef.current;
      if (state === STATES.RESULTS) {
        handleNextFromResults();
      } else if (state === STATES.LEADERBOARD) {
        handleContinuePresenting();
      } else if (state === STATES.PODIUM) {
        handleFinishFromPodium();
      }
    };
    socket.on('presenter:nav', onNav);
    return () => {
      socket.off('presenter:nav', onNav);
    };
  }, [socket, handleNextFromResults, handleContinuePresenting, handleFinishFromPodium]);

  // Loading-state safety net: if we're stuck in LOADING for too long (e.g. reconnect
  // timeout), drop back to the password screen so the host can recover instead of seeing
  // an indefinite spinner.
  useEffect(() => {
    if (gameState !== STATES.LOADING) return;
    const timer = setTimeout(() => {
      if (gameStateRef.current !== STATES.LOADING) return;
      // Only fall back to START if we don't have a session yet — if we do, the server
      // just hasn't echoed `host:question-start` back yet and we don't want to clobber it.
      if (!sid) {
        setGameState(STATES.START);
        setError('Sessie herstellen mislukt');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [gameState, sid, setGameState, setError]);

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

        {(gameState === STATES.LOADING || (gameState === STATES.START && sid)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">
              {sid ? 'Volgende vraag laden...' : 'Verbinden...'}
            </p>
          </motion.div>
        )}

        {gameState === STATES.START && !sid && (
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
            key={`host-countdown-${currentQuestion.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-center"
          >
            {currentQuestion.doublePoints && (
              <div className="mb-8 flex justify-center">
                <DoublePointsBadge size="lg" />
              </div>
            )}
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
            key={`host-question-${currentQuestion.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col justify-between"
          >
            <div className="text-center pt-12">
              {currentQuestion.doublePoints && (
                <div className="mb-6 flex justify-center">
                  <DoublePointsBadge size="md" />
                </div>
              )}
              <h2 className="text-6xl font-black mb-12 leading-tight max-w-5xl mx-auto uppercase tracking-tighter">{currentQuestion.question}</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8 mb-12">
              <div className="grid grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
                {currentQuestion.options.map((opt, idx) => {
                  const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                  return (
                    <motion.div 
                      key={`${opt}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${color.base} rounded-2xl p-10 flex items-center gap-8 border backdrop-blur-md shadow-2xl relative overflow-hidden`}
                    >
                      <div className="text-5xl text-white/40 font-black">{OPTION_SHAPES[idx % OPTION_SHAPES.length]}</div>
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
            key={`host-results-${currentQuestion.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center justify-center h-full px-8"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-3">
                <span className="text-white/40 uppercase tracking-[0.3em] text-xs font-black">Antwoorden</span>
                {currentQuestion.doublePoints && <DoublePointsBadge size="sm" />}
              </div>
              <h2 className="text-5xl font-black max-w-5xl uppercase tracking-tighter leading-tight">{currentQuestion.question}</h2>
            </div>
            
            <div className="flex justify-center items-end h-[460px] gap-8 mb-14 w-full max-w-5xl">
              {currentQuestion.options.map((opt, idx) => {
                const count = answerDistribution[opt] || 0;
                const total = Math.max(1, Object.values(answerDistribution).reduce((a, b) => a + b, 0));
                const heightPercentage = Math.max(4, (count / total) * 100);
                const isCorrect = currentQuestion.answer === opt;
                const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                
                return (
                  <div key={`${opt}-${idx}`} className="flex flex-col items-center justify-end h-full w-44 gap-4 relative">
                    {/* Header: shows count + a clear "JUIST ANTWOORD" pill for the correct option. */}
                    <div className="h-20 flex flex-col items-center justify-end gap-2 relative">
                      {isCorrect && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                          className="bg-white text-black rounded-full px-3 py-1 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest shadow-[0_0_25px_rgba(255,255,255,0.4)] whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Juist
                        </motion.div>
                      )}
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black tracking-tighter text-white"
                      >
                        {count}
                      </motion.span>
                    </div>

                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ type: 'spring', damping: 22, stiffness: 70, delay: 0.1 }}
                      className={`w-full rounded-t-2xl relative border-2 backdrop-blur-sm shadow-2xl ${color.bar} ${
                        isCorrect
                          ? `ring-4 ring-offset-2 ring-offset-transparent ${color.ring} ${color.glow}`
                          : 'opacity-40 grayscale-[40%]'
                      }`}
                    >
                      {/* Subtle pulse on the correct bar so the eye lands there without needing a different color. */}
                      {isCorrect && (
                        <motion.div
                          aria-hidden
                          className="absolute inset-0 rounded-t-2xl bg-white/15"
                          animate={{ opacity: [0, 0.6, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </motion.div>

                    {/* Footer: shape + truncated option text. Correct one gets a bright contrast border. */}
                    <div className={`w-full rounded-2xl border-2 backdrop-blur-md transition-colors ${color.base} ${
                      isCorrect ? 'border-white shadow-[0_0_25px_rgba(255,255,255,0.35)]' : 'opacity-70'
                    }`}>
                      <div className="flex items-center gap-2 px-3 py-3">
                        <div className="text-2xl font-black text-white/80 leading-none">{OPTION_SHAPES[idx % OPTION_SHAPES.length]}</div>
                        <div className="text-sm font-black uppercase tracking-tight text-white truncate flex-1 text-left">{opt}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleNextFromResults}
              className="bg-white text-black hover:bg-slate-100 px-16 py-6 rounded-2xl font-black text-2xl flex items-center gap-6 transition-transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] uppercase tracking-tighter"
            >
              {isFinalQuestion ? (<>Naar het Podium <Trophy className="w-9 h-9" /></>) : (<>Volgende <ChevronRight className="w-10 h-10" /></>)}
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

        {gameState === STATES.PODIUM && (
          <Podium leaderboard={leaderboard} onFinish={handleFinishFromPodium} />
        )}
      </div>
    </div>
  );
}

// ---------- Podium ----------

const PODIUM_SLOTS = [
  // [leaderboard-index, height-class, color-gradient, label, icon]
  { rank: 2, heightPx: 280, gradient: 'from-zinc-200 to-zinc-400', text: 'text-zinc-900', glow: 'shadow-[0_0_80px_rgba(228,228,231,0.4)]', medalColor: 'text-zinc-300', Icon: Medal },
  { rank: 1, heightPx: 400, gradient: 'from-amber-200 to-amber-500', text: 'text-amber-950', glow: 'shadow-[0_0_120px_rgba(245,158,11,0.6)]', medalColor: 'text-amber-300', Icon: Crown },
  { rank: 3, heightPx: 220, gradient: 'from-orange-300 to-orange-600', text: 'text-orange-950', glow: 'shadow-[0_0_70px_rgba(234,88,12,0.4)]', medalColor: 'text-orange-300', Icon: Award },
];

function Podium({ leaderboard, onFinish }) {
  // Stable ordering: derive a sorted-by-score copy so we always show actual ranks 1/2/3.
  const ranked = useMemo(() => [...(leaderboard || [])].sort((a, b) => b.score - a.score), [leaderboard]);
  const top3 = ranked.slice(0, 3);

  // Reveal in order: 3rd → 2nd → 1st, with the climax on #1.
  const [revealStep, setRevealStep] = useState(0); // 0=nothing, 1=#3, 2=#2, 3=#1, 4=done
  useEffect(() => {
    if (revealStep >= 4) return;
    const delays = [800, 1300, 1800, 1200]; // dramatic build-up
    const t = setTimeout(() => setRevealStep((s) => s + 1), delays[revealStep]);
    return () => clearTimeout(t);
  }, [revealStep]);

  const slotVisible = (rank) => {
    if (rank === 3) return revealStep >= 1;
    if (rank === 2) return revealStep >= 2;
    if (rank === 1) return revealStep >= 3;
    return false;
  };

  return (
    <motion.div
      key="host-podium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col items-center justify-center min-h-[80vh] relative"
    >
      {/* Confetti */}
      {revealStep >= 3 && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <span className="text-white/40 uppercase tracking-[0.4em] text-xs font-black block mb-3">Eindstand</span>
        <h2 className="text-7xl font-black uppercase tracking-tighter bg-gradient-to-br from-white via-amber-100 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          Podium
        </h2>
      </motion.div>

      {top3.length === 0 ? (
        <div className="text-white/40 uppercase tracking-widest text-sm font-black mb-12">
          Geen deelnemers
        </div>
      ) : (
        <div className="flex items-end justify-center gap-6 w-full max-w-4xl mb-16 min-h-[480px] px-8">
          {PODIUM_SLOTS.map((slot) => {
            const player = top3[slot.rank - 1];
            const visible = slotVisible(slot.rank) && !!player;
            return (
              <div key={slot.rank} className="flex-1 flex flex-col items-center justify-end relative">
                {/* Player card on top of platform */}
                <AnimatePresence>
                  {visible && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: -40, scale: 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      className="flex flex-col items-center mb-3"
                    >
                      <slot.Icon className={`w-12 h-12 ${slot.medalColor} drop-shadow-[0_0_15px_currentColor] mb-2 ${slot.rank === 1 ? 'animate-pulse' : ''}`} fill="currentColor" />
                      <div className={`px-4 py-2 rounded-xl text-2xl font-black uppercase tracking-tight bg-black/60 border border-white/10 backdrop-blur-xl text-white whitespace-nowrap max-w-[180px] truncate`}>
                        {player.name}
                      </div>
                      <div className="mt-2 text-3xl font-black tracking-tighter text-white font-mono">
                        {player.score}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Platform — animated rise. Use a placeholder height when hidden so layout doesn't jump. */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={visible ? { height: slot.heightPx, opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                  className={`w-full max-w-[200px] rounded-t-3xl bg-gradient-to-b ${slot.gradient} ${slot.glow} relative overflow-hidden border-t-4 border-white/40`}
                >
                  <div className={`absolute inset-x-0 top-3 text-center font-black text-7xl ${slot.text} tracking-tighter opacity-90`}>
                    {slot.rank}
                  </div>
                  {/* Subtle light sweep */}
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    animate={visible ? { left: ['-50%', '150%'] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other players (4th and beyond) appear once the podium is fully built. */}
      <AnimatePresence>
        {revealStep >= 4 && ranked.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl mb-10"
          >
            <div className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-black mb-3 text-center">Overige deelnemers</div>
            <div className="grid grid-cols-2 gap-2">
              {ranked.slice(3).map((player, idx) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-white/30 font-black text-sm w-6 shrink-0">{idx + 4}</span>
                    <span className="text-white/90 font-bold truncate">{player.name}</span>
                  </div>
                  <span className="text-white/70 font-black font-mono ml-2">{player.score}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealStep >= 4 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={onFinish}
            className="bg-white text-black hover:bg-slate-100 px-14 py-5 rounded-2xl font-black text-xl flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.15)] uppercase tracking-tighter"
          >
            Afsluiten <Flag className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Double-points indicator ----------
// Shared between host and player as a visual concept (each file has its own copy so they can
// stay self-contained). High-contrast gold pill with a shimmer sweep + halo pulse so it reads
// even against the busy quiz backgrounds.
function DoublePointsBadge({ size = 'md' }) {
  const sizes = {
    sm: { padding: 'px-3 py-1.5', text: 'text-[10px]', icon: 'w-3.5 h-3.5', gap: 'gap-1.5', tracking: 'tracking-[0.18em]' },
    md: { padding: 'px-5 py-2.5', text: 'text-sm',     icon: 'w-4 h-4',     gap: 'gap-2',   tracking: 'tracking-[0.22em]' },
    lg: { padding: 'px-7 py-3.5', text: 'text-lg',     icon: 'w-6 h-6',     gap: 'gap-3',   tracking: 'tracking-[0.25em]' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative inline-flex"
    >
      {/* Soft halo pulse so the badge breathes against dark backgrounds */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-amber-400/45 blur-2xl"
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className={`relative inline-flex items-center ${s.gap} ${s.padding} rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 font-black uppercase ${s.text} ${s.tracking} border-2 border-amber-100/80 shadow-[0_8px_30px_rgba(245,158,11,0.55)] overflow-hidden whitespace-nowrap`}
      >
        {/* Animated shimmer sweep */}
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

function Confetti() {
  // Lightweight CSS confetti: a fixed pool of falling shapes with randomised motion params.
  const pieces = useMemo(() => {
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#ffffff', '#f97316'];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 200,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 0, rotate: p.rotate }}
          animate={{ y: '110vh', x: p.drift, opacity: [0, 1, 1, 0.8, 0], rotate: p.rotate + 720 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
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
