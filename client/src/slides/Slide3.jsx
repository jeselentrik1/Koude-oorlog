import Slide from '../components/Slide';

export default function Slide3() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <div className="flex items-center mb-12">
          <div className="h-px flex-grow bg-white/10" />
          <h2 className="text-5xl font-black px-8 text-white uppercase tracking-tighter">Waarom dit thema?</h2>
          <div className="h-px flex-grow bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="bg-white/5 p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/10 -mr-8 -mt-8 rotate-45 transition-transform group-hover:scale-150" />
            <div className="text-red-700 text-6xl mb-6 font-black opacity-50 font-mono">01</div>
            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Nucleaire dreiging</h3>
            <p className="text-slate-400 text-lg leading-relaxed">De constante angst voor een totale vernietiging door atoomwapens.</p>
          </div>
          <div className="bg-white/5 p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/10 -mr-8 -mt-8 rotate-45 transition-transform group-hover:scale-150" />
            <div className="text-red-700 text-6xl mb-6 font-black opacity-50 font-mono">02</div>
            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Spionage</h3>
            <p className="text-slate-400 text-lg leading-relaxed">Een schaduwwereld van paranoia, verraad en onzichtbare oorlogen.</p>
          </div>
          <div className="bg-white/5 p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/10 -mr-8 -mt-8 rotate-45 transition-transform group-hover:scale-150" />
            <div className="text-red-700 text-6xl mb-6 font-black opacity-50 font-mono">03</div>
            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">Europa verdeeld</h3>
            <p className="text-slate-400 text-lg leading-relaxed">Het IJzeren Gordijn: gezinnen en landen fysiek uit elkaar getrokken.</p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
