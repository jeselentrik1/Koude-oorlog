import Slide from '../components/Slide';
import nuclearTest from '../assets/nuclear_test.png';
import { useAssetCache } from '../components/AssetContext';

export default function Slide2() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12 border-r border-white/5">
          <h2 className="text-5xl font-black mb-8 text-white uppercase tracking-tighter">Wat was de Koude Oorlog?</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <span>Periode van wereldwijde spanning</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <span>Na WOII tot begin jaren 90</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <span>Twee grootmachten lijnrecht tegenover elkaar</span>
            </li>
          </ul>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 items-center">
          <img src={getAssetUrl(nuclearTest)} alt="Nuclear Test" className="w-full max-w-2xl mb-12 rounded-lg border border-white/10 shadow-2xl" />
          <div className="relative w-full py-8">
            <div className="h-px bg-white/20 w-full absolute top-[calc(2rem+8px)]" />
            <div className="flex justify-between relative">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-red-700 rounded-full mb-4 border-2 border-[#0a0a0c] ring-1 ring-white/20 z-10" />
                <span className="text-xl font-black text-white">1945</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Einde WOII</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-slate-600 rounded-full mb-4 border-2 border-[#0a0a0c] ring-1 ring-white/20 z-10" />
                <span className="text-xl font-black text-white">1961</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Bouw Muur</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-red-700 rounded-full mb-4 border-2 border-[#0a0a0c] ring-1 ring-white/20 z-10" />
                <span className="text-xl font-black text-white">1991</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Einde USSR</span>
              </div>
            </div>
          </div>
          <div className="mt-16 p-6 border border-white/5 bg-white/5 relative">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-red-700" />
            <div className="text-slate-400 italic text-lg text-center max-w-sm font-medium">
              "Een oorlog zonder direct slagveld, maar met een constante dreiging."
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
