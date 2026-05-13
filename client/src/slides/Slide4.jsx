import Slide from '../components/Slide';

export default function Slide4() {
  return (
    <Slide className=" text-white flex flex-col justify-center items-center">
      <div className="text-center relative">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 text-[15rem] font-black text-white/5 leading-none select-none font-mono">
          ?
        </div>
        <div className="inline-block px-6 py-2 border border-red-700/30 bg-red-700/5 mb-8">
          <span className="text-red-700 font-bold uppercase tracking-[0.4em] text-sm">Onderzoeksvraag</span>
        </div>
        <h2 className="text-7xl font-black mb-12 relative z-10 text-white uppercase tracking-tighter">Onze Centrale Vraag</h2>
        <div className="space-y-8 relative z-10">
          <div className="text-4xl text-slate-300 font-bold border-l-4 border-red-700 pl-8 py-2 inline-block">Wat hield de Koude Oorlog in?</div>
          <div className="text-3xl text-slate-400 italic">Welke invloed had dit op de wereld?</div>
          <div className="flex justify-center items-center space-x-4 my-12">
            <div className="h-px w-12 bg-white/10" />
            <div className="w-2 h-2 bg-red-700 rotate-45" />
            <div className="h-px w-12 bg-white/10" />
          </div>
          <div className="text-4xl font-black text-white uppercase tracking-widest bg-white/5 py-4 px-12 border border-white/10 inline-block">
            Focus: <span className="text-red-700">De gewone burger</span>
          </div>
        </div>
      </div>
    </Slide>
  );
}
