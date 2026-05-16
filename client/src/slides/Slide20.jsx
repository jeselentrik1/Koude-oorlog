import Slide from '../components/Slide';

export default function Slide20() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter">De Onzichtbare Oorlog</h2>
        <div className="grid grid-cols-3 gap-8">
           <div className="bg-blue-900/10 border border-blue-500/20 p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="text-4xl font-black mb-6 border-2 border-blue-400 p-2">CIA</div>
              <div className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Verenigde Staten</div>
              <p className="text-sm text-slate-500 italic leading-relaxed">Focus op infiltratie en destabilisatie van communistische regimes.</p>
           </div>
           <div className="bg-red-900/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="text-4xl font-black mb-6 border-2 border-red-400 p-2">KGB</div>
              <div className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Sovjet-Unie</div>
              <p className="text-sm text-slate-500 italic leading-relaxed">Extreme interne controle en wereldwijde inlichtingennetwerken.</p>
           </div>
           <div className="bg-slate-800/50 border border-slate-500/20 p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="text-4xl font-black mb-6 border-2 border-slate-400 p-2">MI6</div>
              <div className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Verenigd Koninkrijk</div>
              <p className="text-sm text-slate-500 italic leading-relaxed">Strategische samenwerking en geavanceerde operaties.</p>
           </div>
        </div>
        <div className="mt-16 text-center text-3xl font-black text-white uppercase tracking-[0.2em]">
           Informatie was het krachtigste wapen
        </div>
      </div>
    </Slide>
  );
}
