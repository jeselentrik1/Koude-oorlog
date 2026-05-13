import Slide from '../components/Slide';

export default function Slide31() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12 border-r border-slate-800">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Een Nieuwe Koude Oorlog?</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <div className="flex items-start">
               <span className="text-red-600 mr-4 font-black">❯</span>
               <p><span className="text-white font-bold">Parallellen met toen:</span> NAVO vs. Rusland.</p>
            </div>
            <div className="flex items-start">
               <span className="text-red-600 mr-4 font-black">❯</span>
               <p><span className="text-white font-bold">Wapenwedloop:</span> In de ruimte en in de digitale wereld.</p>
            </div>
            <div className="flex items-start">
               <span className="text-red-600 mr-4 font-black">❯</span>
               <p><span className="text-white font-bold">Cyberoorlog:</span> Desinformatie en sabotage.</p>
            </div>
            <div className="flex items-start">
               <span className="text-red-600 mr-4 font-black">❯</span>
               <p><span className="text-white font-bold">Proxy-conflict:</span> De oorlog in Oekraïne.</p>
            </div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 items-center">
           <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
              <div className="absolute inset-0 font-mono text-[10px] text-green-500/30 overflow-hidden leading-none break-all p-4">
                 {Array(100).fill("01101010111010101").join("")}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-[12rem] grayscale contrast-200">🛡️</div>
              </div>
           </div>
        </div>
      </div>
    </Slide>
  );
}
