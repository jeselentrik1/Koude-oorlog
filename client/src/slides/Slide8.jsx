import Slide from '../components/Slide';

export default function Slide8() {
  return (
    <Slide className="bg-red-950 text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex items-center justify-center relative order-2">
          <div className="absolute inset-0 bg-red-900/20 rounded-3xl border border-red-500/30 -rotate-3" />
          <div className="relative z-10 flex flex-col items-center space-y-12">
             <div className="text-9xl">🚩</div>
             <div className="text-8xl font-black">☭</div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 order-1">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Het Oosten</h2>
          <div className="space-y-8 text-2xl text-red-100">
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Leider</span>
              Sovjet-Unie (USSR)
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Ideologie</span>
              Communisme
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Kenmerken</span>
              Controle door de staat, geen tegenstand
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Bondgenootschap</span>
              Warschaupact
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
