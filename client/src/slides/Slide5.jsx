import Slide from '../components/Slide';

export default function Slide5() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <h2 className="text-5xl font-black mb-12 text-white uppercase tracking-tighter text-center">Onze Invalshoeken</h2>
        <div className="grid grid-cols-3 gap-8 items-center h-2/3">
          <div className="aspect-[2/3] bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20" />
            <div className="text-red-700 text-3xl mb-6 font-mono opacity-50">#01</div>
            <div className="text-xl font-black text-white uppercase tracking-tight">Heldere hemel</div>
            <div className="mt-4 text-sm text-slate-500 uppercase tracking-widest font-bold">Tom Lanoye</div>
          </div>
          <div className="aspect-[2/3] bg-white/10 border-2 border-red-700/50 flex flex-col items-center justify-center p-8 text-center scale-105 shadow-2xl relative">
            <div className="absolute inset-0 bg-red-900/5" />
            <div className="text-red-700 text-3xl mb-6 font-mono opacity-80">#02</div>
            <div className="text-xl font-black text-white uppercase tracking-tight">Een erfenis van spionnen</div>
            <div className="mt-4 text-sm text-slate-500 uppercase tracking-widest font-bold">John le Carré</div>
            <div className="absolute bottom-4 left-0 right-0 text-[0.6rem] text-red-700/50 font-mono tracking-widest uppercase">CLASSIFIED CONTENT</div>
          </div>
          <div className="aspect-[2/3] bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20" />
            <div className="text-red-700 text-3xl mb-6 font-mono opacity-50">#03</div>
            <div className="text-xl font-black text-white uppercase tracking-tight">Muurziek</div>
            <div className="mt-4 text-sm text-slate-500 uppercase tracking-widest font-bold">Wouter Polspoel</div>
          </div>
        </div>
        <div className="mt-12 flex justify-center items-center space-x-6">
          <div className="h-px w-8 bg-white/10" />
          <p className="text-xl text-slate-400 italic font-medium">
            "Historische feiten ontmoeten persoonlijke tragedies"
          </p>
          <div className="h-px w-8 bg-white/10" />
        </div>
      </div>
    </Slide>
  );
}
