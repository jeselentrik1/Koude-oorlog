import Slide from '../components/Slide';
import wallImage from '../assets/wall.png';
import { useAssetCache } from '../components/AssetContext';

export default function Slide14() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter">De Harde Realiteit</h2>
        <div className="grid grid-cols-2 gap-12">
           <div className="space-y-8 text-2xl text-slate-400">
              <p>Geen gewone grens, maar een <span className="text-white font-bold">dodenstrook</span>.</p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                  Prikkeldraad en mijnenvelden
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                  Wachttorens met schijnwerpers
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                  <span className="text-red-500 font-bold uppercase">Schiessbefehl: <span className="text-white">Bevel om te schieten</span></span>
                </li>
              </ul>
           </div>
           <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col justify-center items-center overflow-hidden">
              <img src={getAssetUrl(wallImage)} alt="Berlijnse Muur" className="w-full h-full object-cover" />
           </div>
        </div>
      </div>
    </Slide>
  );
}
