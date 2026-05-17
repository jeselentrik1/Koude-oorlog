import Slide from '../components/Slide';
import wallImage from '../assets/wall.png';
import { useAssetCache } from '../components/AssetContext';

export default function Slide14() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pl-12 pr-12 border-r border-slate-800">
          <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter text-white">De Harde Realiteit</h2>
          <div className="space-y-12 text-2xl text-slate-300">
            <p>Geen gewone grens, maar een <span className="text-white font-bold">dodenstrook</span>.</p>
            <ul className="space-y-6">
              <li className="flex items-start">
                <span className="text-red-600 mr-4 font-black mt-1.5">&gt;</span>
                Prikkeldraad en mijnenvelden
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-4 font-black mt-1.5">&gt;</span>
                Wachttorens met schijnwerpers
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-4 font-black mt-1.5">&gt;</span>
                <span className="text-red-500 font-bold uppercase">Schiessbefehl: <span className="text-white">Bevel om te schieten</span></span>
              </li>
            </ul>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
             <img src={getAssetUrl(wallImage)} alt="Berlijnse Muur" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </Slide>
  );
}
