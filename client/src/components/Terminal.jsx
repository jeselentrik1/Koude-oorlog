import { useState, useEffect, useRef } from 'react';

const keyboardMap = {
  'q': [0, 0], 'w': [1, 0], 'e': [2, 0], 'r': [3, 0], 't': [4, 0], 'y': [5, 0], 'u': [6, 0], 'i': [7, 0], 'o': [8, 0], 'p': [9, 0],
  'a': [0.2, 1], 's': [1.2, 1], 'd': [2.2, 1], 'f': [3.2, 1], 'g': [4.2, 1], 'h': [5.2, 1], 'j': [6.2, 1], 'k': [7.2, 1], 'l': [8.2, 1],
  'z': [0.5, 2], 'x': [1.5, 2], 'c': [2.5, 2], 'v': [3.5, 2], 'b': [4.5, 2], 'n': [5.5, 2], 'm': [6.5, 2],
  '1': [0, -1], '2': [1, -1], '3': [2, -1], '4': [3, -1], '5': [4, -1], '6': [5, -1], '7': [6, -1], '8': [7, -1], '9': [8, -1], '0': [9, -1],
  '-': [10, -1], '=': [11, -1], ',': [7.5, 2], '.': [8.5, 2], '/': [9.5, 2], ' ': [4, 3], ':': [8.2, 1], '#': [2, -1], '~': [-1, 0],
  '@': [1, -1], '_': [10, -1], '>': [9.5, 2], '(': [8, -1], ')': [9, -1], '&': [6, -1], '|': [12, 0], '*': [7, -1], '[': [10, 0],
  ']': [11, 0], '!': [0, -1], '+': [11, -1]
};

const getDistance = (char1, char2) => {
  const p1 = keyboardMap[char1.toLowerCase()] || [5, 5];
  const p2 = keyboardMap[char2.toLowerCase()] || [5, 5];
  let dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  
  if ((char1 === char1.toUpperCase() && char1 !== char1.toLowerCase()) !== 
      (char2 === char2.toUpperCase() && char2 !== char2.toLowerCase())) {
    dist += 3;
  }
  return dist;
};

export default function Terminal({ terminalLines, className = "" }) {
  const [lines, setLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentTyped, setCurrentTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typoIndex, setTypoIndex] = useState(-1);
  const [cursorVisible, setCursorVisible] = useState(true);
  const terminalRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) {
      const timeout = setTimeout(() => {
        setLines([]);
        setCurrentLineIndex(0);
        setCurrentTyped('');
        setIsDeleting(false);
        setTypoIndex(-1);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    const line = terminalLines[currentLineIndex];
    let timeout;

    if (line.type === 'command') {
      if (!isDeleting && currentTyped.length < line.text.length) {
        if (currentTyped === '') {
          timeout = setTimeout(() => {
            setCurrentTyped(line.text.slice(0, 1));
          }, line.delay || 1000);
        } else {
          const nextChar = line.text[currentTyped.length];
          const prevChar = currentTyped[currentTyped.length - 1] || ' ';
          
          if (line.text.length > 15 && typoIndex === -1 && Math.random() > 0.99) {
            const charCode = nextChar.charCodeAt(0);
            const typoChar = String.fromCharCode(charCode + (Math.random() > 0.5 ? 1 : -1));
            setCurrentTyped(prev => prev + typoChar);
            setTypoIndex(currentTyped.length);
            timeout = setTimeout(() => setIsDeleting(true), 50);
            return () => clearTimeout(timeout);
          }

          const distance = getDistance(prevChar, nextChar);
          // Base delay using the ignored typingSpeed property (defaults to 50 if missing)
          const baseSpeed = line.typingSpeed || 50; 
          let delay = (baseSpeed * 0.2) + distance * (baseSpeed * 0.24) + Math.random() * (baseSpeed * 0.3);
          
          if (nextChar === ' ' || nextChar === '-' || nextChar === '.') {
            delay += 30 + Math.random() * 40;
          }

          // Simulate tab completion for long paths/words
          const tabTriggers = [
            '/var/log/ng',
            '--script=modbus-dis',
            'WRITE_REG',
            './wipe_',
            'auxiliary/scanner/scada/modbusclien'
          ];

          let isTabCompletion = false;
          let jumpLength = 0;

          for (const trigger of tabTriggers) {
            if (currentTyped.endsWith(trigger)) {
              const remainingLine = line.text.slice(currentTyped.length);
              const match = remainingLine.match(/^([a-zA-Z0-9_\-\.\/]+)/);
              if (match) {
                isTabCompletion = true;
                jumpLength = match[1].length;
                break;
              }
            }
          }

          if (isTabCompletion) {
            const tabDelay = 150 + Math.random() * 150;
            timeout = setTimeout(() => {
              setCurrentTyped(line.text.slice(0, currentTyped.length + jumpLength));
            }, tabDelay);
          } else {
            timeout = setTimeout(() => {
              setCurrentTyped(line.text.slice(0, currentTyped.length + 1));
            }, delay);
          }
        }
      } else if (isDeleting) {
        timeout = setTimeout(() => {
          setCurrentTyped(prev => prev.slice(0, -1));
          if (currentTyped.length <= typoIndex) {
            setIsDeleting(false);
            setTypoIndex(-1);
          }
        }, 15 + Math.random() * 10); // Panic deletion - much faster than typing
      } else {
        // Decision pause - wait a moment before hitting 'Enter'
        timeout = setTimeout(() => {
          setLines(prev => [...prev, { ...line, text: currentTyped }]);
          setCurrentTyped('');
          setCurrentLineIndex(prev => prev + 1);
        }, 300 + Math.random() * 500); // 300-800ms pause
      }
    } else {
      // Output streaming
      timeout = setTimeout(() => {
        setLines(prev => [...prev, line]);
        setCurrentLineIndex(prev => prev + 1);
      }, line.delay || (20 + Math.random() * 80)); // Fallback to 20-100ms for streaming feel
    }

    return () => clearTimeout(timeout);
  }, [currentLineIndex, currentTyped, isDeleting, typoIndex, terminalLines]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, currentTyped]);

  const getWindowTitle = () => {
    const baseTitle = 'root@kali: ~';
    if (currentLineIndex === 0 && currentTyped === '') return baseTitle;

    const allCompletedLines = lines;
    const lastCompletedCommand = [...allCompletedLines].reverse().find(l => l.type === 'command');
    
    const isMsfActive = allCompletedLines.some(l => l.text === 'msfconsole -q') && 
                       !allCompletedLines.some(l => l.text === 'exit' && l.prompt && l.prompt.includes('msf6'));

    if (isMsfActive) {
      const useCmd = [...allCompletedLines].reverse().find(l => l.text.startsWith('use '));
      const hasExitedModule = [...allCompletedLines].reverse().find(l => l.text === 'exit' && l.prompt && l.prompt.includes('('));
      
      if (useCmd && (!hasExitedModule || allCompletedLines.indexOf(useCmd) > allCompletedLines.indexOf(hasExitedModule))) {
        let module = useCmd.text.split(' ').pop();
        if (module === '0') module = 'modbusclient';
        else module = module.split('/').pop();
        return `msfconsole (${module})`;
      }
      return 'msfconsole';
    }

    if (currentLineIndex < terminalLines.length && terminalLines[currentLineIndex].type === 'command') {
      return baseTitle;
    }

    if (lastCompletedCommand) {
      const cmdText = lastCompletedCommand.text;
      if (cmdText.startsWith('nmap')) return 'nmap';
      if (cmdText.startsWith('ip a')) return 'ip';
      if (cmdText.startsWith('whoami')) return 'whoami';
      if (cmdText.startsWith('./wipe_logs.sh')) return 'sh';
    }
    
    return baseTitle;
  };

  const renderPrompt = (prompt) => {
    if (!prompt) return null;
    if (prompt.startsWith('root@kali')) {
      return (
        <span className="font-bold mr-2">
          <span className="text-red-500">root@kali</span>
          <span className="text-white">:</span>
          <span className="text-blue-500">~</span>
          <span className="text-white">#</span>
        </span>
      );
    } else if (prompt.startsWith('msf6')) {
      const isModule = prompt.includes('(');
      if (isModule) {
         const moduleName = prompt.substring(5, prompt.indexOf('>')).trim();
         return (
            <span className="font-bold mr-2">
              <span className="text-red-500 underline">msf6</span>
              <span className="text-red-400"> {moduleName}</span>
              <span className="text-white"> &gt;</span>
            </span>
         );
      } else {
         return (
            <span className="font-bold mr-2">
              <span className="text-red-500 underline">msf6</span>
              <span className="text-white"> &gt;</span>
            </span>
         );
      }
    }
    return <span className="text-slate-400 font-bold mr-2">{prompt}</span>;
  };

  return (
    <div className={`relative w-full h-[500px] bg-[#0c0c0c] rounded-lg overflow-hidden border border-slate-700 font-mono text-xs xl:text-sm flex flex-col ${className}`}>
      {/* Terminal Header */}
      <div className="bg-[#1a1a1a] px-4 py-2 flex items-center border-b border-slate-800">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="mx-auto text-slate-300 text-[11px] flex-1 text-center font-sans tracking-tight font-medium opacity-90">
          {getWindowTitle()}
        </div>
      </div>
      
      {/* Terminal Body */}
      <div 
        className="p-4 overflow-y-auto flex-1 flex flex-col items-start text-left space-y-1 terminal-scrollbar" 
        ref={terminalRef}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#4a5568 #1a1a1a'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .terminal-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .terminal-scrollbar::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .terminal-scrollbar::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-radius: 4px;
          }
          .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #718096;
          }
        `}} />
        {lines.map((line, i) => (
          <div key={i} className="w-full break-words leading-relaxed">
            {line.type === 'command' && renderPrompt(line.prompt)}
            <span className={line.color}>{line.text}</span>
          </div>
        ))}
        {currentLineIndex < terminalLines.length && terminalLines[currentLineIndex].type === 'command' && (
          <div className="w-full break-words leading-relaxed">
            {renderPrompt(terminalLines[currentLineIndex].prompt)}
            <span className={terminalLines[currentLineIndex].color}>{currentTyped}</span>
            <span className={`inline-block w-2 h-4 bg-slate-400 align-middle ml-1 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
          </div>
        )}
      </div>
    </div>
  );
}
