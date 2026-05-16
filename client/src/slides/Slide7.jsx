import Slide from '../components/Slide';

export default function Slide7() {
  return (
    <Slide className="bg-blue-950 text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Het Westen</h2>
          <div className="space-y-8 text-2xl text-blue-100">
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Leider</span>
              Verenigde Staten (VS)
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Ideologie</span>
              Kapitalisme & Democratie
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Kenmerken</span>
              Vrije economie, privébezit, verkiezingen
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Bondgenootschap</span>
              NAVO (1949)
            </div>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-blue-900/20 rounded-3xl border border-blue-500/30 rotate-3" />
          <div className="relative z-10 flex flex-col items-center space-y-12">
             <div className="text-9xl">🇺🇸</div>
             <div className="text-4xl font-black border-4 border-white p-4">NATO</div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
