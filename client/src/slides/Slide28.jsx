import Slide from '../components/Slide';
import { useState, useEffect, useRef } from 'react';

const terminalLines = [
  { type: 'command', prompt: 'root@kali:~# ', text: 'ls -la /var/log/nginx', color: 'text-green-400', delay: 1000, typingSpeed: 50 },
  { type: 'output', text: 'total 12\ndrwxr-xr-x  2 root root 4096 May 16 23:00 .\ndrwxr-xr-x 10 root root 4096 May 16 23:00 ..\n-rw-r--r--  1 root root    0 May 16 23:00 access.log\n-rw-r--r--  1 root root    0 May 16 23:00 error.log', color: 'text-slate-300', delay: 400 },
  { type: 'command', prompt: 'root@kali:~# ', text: 'whoami', color: 'text-green-400', delay: 1200, typingSpeed: 60 },
  { type: 'output', text: 'root', color: 'text-slate-300', delay: 200 },
  { type: 'command', prompt: 'root@kali:~# ', text: 'ip a | grep "inet " | grep -v 127.0.0.1', color: 'text-green-400', delay: 1500, typingSpeed: 45 },
  { type: 'output', text: '    inet 192.168.50.5/24 brd 192.168.50.255 scope global eth0', color: 'text-slate-300', delay: 300 },
  { type: 'command', prompt: 'root@kali:~# ', text: 'nmap -sn 192.168.50.0/24', color: 'text-green-400', delay: 2000, typingSpeed: 50 },
  { type: 'output', text: 'Starting Nmap 7.93 ( https://nmap.org ) at 2026-05-16 23:13 UTC', color: 'text-slate-300', delay: 400 },
  { type: 'output', text: 'Nmap scan report for 192.168.50.1', color: 'text-slate-300', delay: 100 },
  { type: 'output', text: 'Nmap scan report for 192.168.50.12', color: 'text-slate-300', delay: 100 },
  { type: 'output', text: 'Nmap scan report for 192.168.50.44', color: 'text-slate-300', delay: 100 },
  { type: 'output', text: 'Nmap done: 256 IP addresses (3 hosts up) scanned in 2.14 seconds', color: 'text-slate-300', delay: 200 },
  { type: 'command', prompt: 'root@kali:~# ', text: 'nmap -sV -p 502 --script=modbus-discover 192.168.50.12', color: 'text-green-400', delay: 1800, typingSpeed: 40 },
  { type: 'output', text: 'Starting Nmap 7.93 ( https://nmap.org ) at 2026-05-16 23:14 UTC', color: 'text-slate-300', delay: 400 },
  { type: 'output', text: 'Nmap scan report for scada-grid-controller.local (192.168.50.12)', color: 'text-slate-300', delay: 100 },
  { type: 'output', text: 'PORT    STATE SERVICE  VERSION', color: 'text-green-300', delay: 400 },
  { type: 'output', text: '502/tcp open  modbus   Modbus TCP', color: 'text-red-400 font-bold', delay: 600 },
  { type: 'output', text: '| modbus-discover:', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '|   Device ID: 01', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '|   Vendor: Siemens', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '|_  Model: SIMATIC S7-1200', color: 'text-slate-400', delay: 200 },
  { type: 'command', prompt: 'root@kali:~# ', text: 'msfconsole -q', color: 'text-green-400', delay: 2500, typingSpeed: 60 },
  { type: 'output', text: '[*] Starting the Metasploit Framework console...', color: 'text-blue-400', delay: 800 },
  { type: 'output', text: '[*] Database connection established', color: 'text-blue-400', delay: 400 },
  { type: 'command', prompt: 'msf6 > ', text: 'search modbus type:auxiliary', color: 'text-yellow-200', delay: 2200, typingSpeed: 45 },
  { type: 'output', text: 'Matching Modules', color: 'text-slate-300 font-bold underline', delay: 400 },
  { type: 'output', text: '   #  Name                                      Disclosure Date  Rank    Check  Description', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '   -  ----                                      ---------------  ----    -----  -----------', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '   0  auxiliary/scanner/scada/modbusclient                       normal  No     Modbus Client Utility', color: 'text-slate-300', delay: 50 },
  { type: 'output', text: '   1  auxiliary/scanner/scada/modbus_findunitid                  normal  No     Modbus Unit ID Scanner', color: 'text-slate-300', delay: 50 },
  { type: 'command', prompt: 'msf6 > ', text: 'use 0', color: 'text-yellow-200', delay: 1800, typingSpeed: 60 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'show options', color: 'text-yellow-200', delay: 1500, typingSpeed: 40 },
  { type: 'output', text: 'Module options (auxiliary/scanner/scada/modbusclient):', color: 'text-slate-300 font-bold', delay: 400 },
  { type: 'output', text: '   Name           Current Setting  Required  Description', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '   ----           ---------------  --------  -----------', color: 'text-slate-400', delay: 50 },
  { type: 'output', text: '   DATA_ADDRESS   0                yes       The starting address for the data', color: 'text-slate-300', delay: 50 },
  { type: 'output', text: '   RHOSTS                          yes       The target host(s)', color: 'text-slate-300', delay: 50 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'set RHOSTS 192.168.50.12', color: 'text-yellow-200', delay: 1600, typingSpeed: 35 },
  { type: 'output', text: 'RHOSTS => 192.168.50.12', color: 'text-slate-300', delay: 100 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'set DATA_ADDRESS 40001', color: 'text-yellow-200', delay: 1200, typingSpeed: 40 },
  { type: 'output', text: 'DATA_ADDRESS => 40001', color: 'text-slate-300', delay: 100 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'run', color: 'text-yellow-200', delay: 1500, typingSpeed: 50 },
  { type: 'output', text: '[*] 192.168.50.12:502 - Sending MODBUS READ HOLDING REGISTERS...', color: 'text-blue-400', delay: 600 },
  { type: 'output', text: '[+] 192.168.50.12:502 - Modbus Unit ID: 1, Register 40001: 0x00FF', color: 'text-green-400 font-bold', delay: 800 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'set ACTION WRITE_REGISTER', color: 'text-yellow-200', delay: 1800, typingSpeed: 35 },
  { type: 'output', text: 'ACTION => WRITE_REGISTER', color: 'text-slate-300', delay: 100 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'set DATA 0x0000', color: 'text-yellow-200', delay: 1200, typingSpeed: 45 },
  { type: 'output', text: 'DATA => 0x0000', color: 'text-slate-300', delay: 100 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'run', color: 'text-red-400 font-bold', delay: 2000, typingSpeed: 60 },
  { type: 'output', text: '[*] 192.168.50.12:502 - Sending MODBUS WRITE REGISTER...', color: 'text-blue-400', delay: 600 },
  { type: 'output', text: '[!] 192.168.50.12:502 - WARNING: Register 40001 value modified!', color: 'text-yellow-400 font-bold', delay: 400 },
  { type: 'output', text: '[+] 192.168.50.12:502 - POWER GRID SECTOR 4 OFFLINE', color: 'text-red-500 font-black animate-pulse', delay: 1000 },
  { type: 'command', prompt: 'msf6 auxiliary(scanner/scada/modbusclient) > ', text: 'exit', color: 'text-slate-400', delay: 3000, typingSpeed: 50 },
  { type: 'command', prompt: 'root@kali:~# ', text: './wipe_logs.sh && exit', color: 'text-slate-400', delay: 2500, typingSpeed: 40 },
  { type: 'output', text: 'Cleaning system logs...', color: 'text-slate-400', delay: 400 },
  { type: 'output', text: 'Removing bash history...', color: 'text-slate-400', delay: 300 },
  { type: 'output', text: 'Connection closed by foreign host.', color: 'text-slate-400', delay: 1000 },
];

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
  
  // Penalty for switching case (Shift key)
  if ((char1 === char1.toUpperCase() && char1 !== char1.toLowerCase()) !== 
      (char2 === char2.toUpperCase() && char2 !== char2.toLowerCase())) {
    dist += 3;
  }
  return dist;
};

export default function Slide28() {
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
          // Pause BEFORE starting to type
          timeout = setTimeout(() => {
            setCurrentTyped(line.text.slice(0, 1));
          }, line.delay || 1000);
        } else {
          // Realistic typing: variable speed based on keyboard distance
          const nextChar = line.text[currentTyped.length];
          const prevChar = currentTyped[currentTyped.length - 1] || ' ';
          
          // Instant correction logic: check for typo
          if (line.text.length > 15 && typoIndex === -1 && Math.random() > 0.99) {
            const charCode = nextChar.charCodeAt(0);
            const typoChar = String.fromCharCode(charCode + (Math.random() > 0.5 ? 1 : -1));
            setCurrentTyped(prev => prev + typoChar);
            setTypoIndex(currentTyped.length);
            // Instant realization of typo
            timeout = setTimeout(() => setIsDeleting(true), 50);
            return () => clearTimeout(timeout);
          }

          const distance = getDistance(prevChar, nextChar);
          // Base delay + distance factor + small random jitter
          let delay = 10 + distance * 12 + Math.random() * 15;
          
          // Specific character pauses
          if (nextChar === ' ' || nextChar === '-' || nextChar === '.') {
            delay += 50 + Math.random() * 50;
          }

          timeout = setTimeout(() => {
            setCurrentTyped(line.text.slice(0, currentTyped.length + 1));
          }, delay);
        }
      } else if (isDeleting) {
        // Instant correction: very fast backspacing
        timeout = setTimeout(() => {
          setCurrentTyped(prev => prev.slice(0, -1));
          if (currentTyped.length <= typoIndex) {
            setIsDeleting(false);
            setTypoIndex(-1);
          }
        }, 30);
      } else {
        // Finished typing the command, wait a VERY short time before "executing" (hitting enter)
        timeout = setTimeout(() => {
          setLines(prev => [...prev, { ...line, text: currentTyped }]);
          setCurrentTyped('');
          setCurrentLineIndex(prev => prev + 1);
        }, 150 + Math.random() * 100);
      }
    } else {
      // It's output, show it after its specified delay
      timeout = setTimeout(() => {
        setLines(prev => [...prev, line]);
        setCurrentLineIndex(prev => prev + 1);
      }, line.delay || 100);
    }

    return () => clearTimeout(timeout);
  }, [currentLineIndex, currentTyped, isDeleting, typoIndex]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, currentTyped]);

  const getWindowTitle = () => {
    const baseTitle = 'root@kali: ~';
    
    // If we haven't started yet
    if (currentLineIndex === 0 && currentTyped === '') return baseTitle;

    // Get all lines that have been fully added to the terminal so far
    const allCompletedLines = lines;
    const lastCompletedCommand = [...allCompletedLines].reverse().find(l => l.type === 'command');
    
    // Check if we are currently inside msfconsole
    const isMsfActive = allCompletedLines.some(l => l.text === 'msfconsole -q') && 
                       !allCompletedLines.some(l => l.text === 'exit' && l.prompt && l.prompt.includes('msf6'));

    if (isMsfActive) {
      // Find the most recent 'use' command to show current module
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

    // If we are currently typing a command, the title is still the shell title
    if (currentLineIndex < terminalLines.length && terminalLines[currentLineIndex].type === 'command') {
      return baseTitle;
    }

    // If we just finished a command and are now showing its output
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
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12 border-r border-slate-800">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Een Nieuwe Koude Oorlog?</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
               <span className="text-red-600 mr-4 font-black">&gt;</span>
               <p><span className="text-white font-bold">Parallellen met toen:</span> NAVO vs. Rusland.</p>
            </li>
            <li className="flex items-start">
               <span className="text-red-600 mr-4 font-black">&gt;</span>
               <p><span className="text-white font-bold">Wapenwedloop:</span> In de ruimte en in de digitale wereld.</p>
            </li>
            <li className="flex items-start">
               <span className="text-red-600 mr-4 font-black">&gt;</span>
               <p><span className="text-white font-bold">Cyberoorlog:</span> Desinformatie en sabotage.</p>
            </li>
            <li className="flex items-start">
               <span className="text-red-600 mr-4 font-black">&gt;</span>
               <p><span className="text-white font-bold">Proxy-conflict:</span> De oorlog in Oekraïne.</p>
            </li>
          </ul>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 items-center">
           <div className="relative w-full h-[500px] bg-[#0c0c0c] rounded-lg overflow-hidden border border-slate-700 font-mono text-xs xl:text-sm flex flex-col">
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
        </div>
      </div>
    </Slide>
  );
}
