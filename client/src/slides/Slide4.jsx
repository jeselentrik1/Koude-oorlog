import Slide from '../components/Slide';

export default function Slide4() {
  return (
    <Slide className=" text-white flex flex-col justify-center items-center">
      <div className="text-center relative">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 text-[15rem] font-black text-white/5 leading-none select-none font-mono">
          ?
        </div>
        <h2 className="text-7xl font-black mb-12 relative z-10 text-white uppercase tracking-tighter">Onze Centrale Vraag</h2>
        <div className="space-y-8 relative z-10">
          <div className="text-4xl text-slate-300 font-bold">Wat hield de Koude Oorlog in?</div>
          <div className="text-3xl text-slate-400 italic">Welke invloed had dit op de wereld?</div>
        </div>
      </div>
    </Slide>
  );
}
