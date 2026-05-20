import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from './SocketContext';

const PresenterDataContext = createContext(null);

const SPEAKERS = ['Jess', 'Thibo', 'Nour'];

/**
 * Builds the presenter-data socket and exposes a synchronized view of:
 *   - speaker notes (keyed by `slideKey = "${slideIdx}.${subIdx}"`)
 *   - main + per-speaker timer state (server is source of truth)
 *
 * The component using this provider can either be:
 *   - the main presentation deck (broadcasts slide changes)
 *   - the presenter view popup
 *   - the edit panel
 *
 * The server keeps timer math correct across speaker/slide changes; the client
 * just has to render the *live* elapsed time using the offset between local
 * wall-clock time and the server's reported `serverNow`.
 */
export function PresenterDataProvider({ children }) {
  const { socket } = useSocket();
  const [available, setAvailable] = useState(true);
  const [notes, setNotes] = useState({});
  const [timerState, setTimerState] = useState(null);
  const clientReceivedAtRef = useRef(0);
  const serverNowAtReceiveRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const handleSnapshot = ({ state, notes: notesMap }) => {
      clientReceivedAtRef.current = Date.now();
      serverNowAtReceiveRef.current = state.serverNow;
      setTimerState(state);
      setNotes(notesMap || {});
      setAvailable(true);
    };
    const handleState = (state) => {
      clientReceivedAtRef.current = Date.now();
      serverNowAtReceiveRef.current = state.serverNow;
      setTimerState(state);
    };
    const handleNote = ({ slideKey, speaker, notes: noteHtml }) => {
      setNotes((prev) => ({ ...prev, [slideKey]: { speaker: speaker || '', notes: noteHtml || '' } }));
    };
    const handleUnavailable = () => setAvailable(false);
    const sendHello = () => {
      socket.emit('presenter:hello');
    };

    socket.on('connect', sendHello);
    socket.on('presenter:snapshot', handleSnapshot);
    socket.on('presenter:state', handleState);
    socket.on('presenter:note', handleNote);
    socket.on('presenter:unavailable', handleUnavailable);
    if (socket.connected) sendHello();

    return () => {
      socket.off('connect', sendHello);
      socket.off('presenter:snapshot', handleSnapshot);
      socket.off('presenter:state', handleState);
      socket.off('presenter:note', handleNote);
      socket.off('presenter:unavailable', handleUnavailable);
    };
  }, [socket]);

  const sendSlideChange = (slideKey) => {
    if (!socket) return;
    socket.emit('presenter:slide-change', { slideKey });
  };
  const sendNote = (slideKey, { speaker, notes: noteHtml }) => {
    if (!socket) return;
    socket.emit('presenter:set-note', { slideKey, speaker, notes: noteHtml });
    // optimistic local update so the editor stays snappy
    setNotes((prev) => ({ ...prev, [slideKey]: { speaker: speaker || '', notes: noteHtml || '' } }));
  };
  const timerAction = (action) => {
    if (!socket) return;
    socket.emit('presenter:timer', { action });
  };

  /** Remote control: presenter window asks the main /present tab to go prev/next (same logic as keyboard). */
  const emitDeckNav = (direction) => {
    if (!socket) return;
    socket.emit('presenter:nav', { direction });
  };

  /**
   * Returns the live elapsed milliseconds for both the main timer and each
   * speaker, given the server's last known timer state. This is called every
   * animation frame by display components.
   */
  const computeElapsed = useMemo(() => {
    return () => {
      if (!timerState) {
        return { main: 0, speakers: { Jess: 0, Thibo: 0, Nour: 0 } };
      }
      const offset = clientReceivedAtRef.current - serverNowAtReceiveRef.current;
      const serverNow = Date.now() - offset;
      const speakers = { ...timerState.speakerAccumulated };
      let main = timerState.mainAccumulated;
      if (timerState.running) {
        main += Math.max(0, serverNow - timerState.mainStartedAt);
        if (timerState.currentSpeaker && SPEAKERS.includes(timerState.currentSpeaker)) {
          speakers[timerState.currentSpeaker] =
            (speakers[timerState.currentSpeaker] || 0) +
            Math.max(0, serverNow - timerState.speakerStartedAt);
        }
      }
      return { main, speakers };
    };
  }, [timerState]);

  const value = {
    socket,
    available,
    notes,
    timerState,
    speakers: SPEAKERS,
    sendSlideChange,
    sendNote,
    timerAction,
    emitDeckNav,
    computeElapsed,
  };

  return <PresenterDataContext.Provider value={value}>{children}</PresenterDataContext.Provider>;
}

export function usePresenterData() {
  const ctx = useContext(PresenterDataContext);
  if (!ctx) throw new Error('usePresenterData must be used within PresenterDataProvider');
  return ctx;
}

export const PRESENTER_SPEAKERS = SPEAKERS;
export const SPEAKER_COLORS = {
  Jess: { accent: 'text-fuchsia-300', border: 'border-fuchsia-400/40', bg: 'bg-fuchsia-500/10', solid: 'bg-fuchsia-500', dot: 'bg-fuchsia-400' },
  Thibo: { accent: 'text-sky-300', border: 'border-sky-400/40', bg: 'bg-sky-500/10', solid: 'bg-sky-500', dot: 'bg-sky-400' },
  Nour: { accent: 'text-amber-300', border: 'border-amber-400/40', bg: 'bg-amber-500/10', solid: 'bg-amber-500', dot: 'bg-amber-400' },
};

export function speakerColor(speaker) {
  return SPEAKER_COLORS[speaker] || {
    accent: 'text-white/60',
    border: 'border-white/15',
    bg: 'bg-white/5',
    solid: 'bg-white/30',
    dot: 'bg-white/30',
  };
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
