import Slide from '../components/Slide';

export default function Slide18() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative">
             <div className="text-[12rem] opacity-20">👋</div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-white/50 border-y-4 border-white/50 py-4 px-8 rotate-12">
                VERBODEN
             </div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <div className="mb-4 text-slate-500 font-bold uppercase tracking-widest text-xl">Muurziek</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Leven in Angst</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Families bruut van elkaar gescheiden.</p>
            <p className="text-white font-bold italic">"De Muurziek"</p>
            <p>Het verstikkende gevoel van opgesloten te zijn in eigen stad.</p>
            <div className="h-px bg-slate-800 my-4" />
            <p className="text-lg text-slate-500 italic">
              "Sepp mag niet naar het trouwfeest van zijn eigen familie."
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
