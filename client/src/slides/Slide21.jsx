import Slide from '../components/Slide';

export default function Slide21() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12 border-r border-slate-800">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Waarom "Koud"?</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Geen directe strijd tussen VS en Sovjet-Unie.</p>
            <p className="text-white font-bold">De oorzaak: Kernwapens.</p>
            <p>Een confrontatie zou het einde van de wereld betekenen.</p>
            <div className="h-px bg-slate-800 my-4" />
            <p className="text-red-500 uppercase tracking-widest font-black">Wapenwedloop</p>
            <p>Miljarden aan uitgaven voor steeds grotere arsenalen.</p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center relative pl-12">
           <div className="text-[12rem] grayscale contrast-200 opacity-50">🚀</div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 text-9xl">☢</div>
        </div>
      </div>
    </Slide>
  );
}
