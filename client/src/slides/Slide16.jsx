import Slide from '../components/Slide';
import stasiImage from '../assets/stasi.webp';
import { useAssetCache } from '../components/AssetContext';

export default function Slide16() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-slate-500 font-bold uppercase tracking-widest text-xl">Muurziek</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Stasi</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p><span className="text-red-500 font-bold">Ministerium für Staatssicherheit:</span> De ogen en oren van de staat.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Extreme controle door afluisteren.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="border-l-4 border-slate-500 pl-6 py-2 bg-slate-900/10 italic">
                Niemand was te vertrouwen, zelfs je geliefde niet.
              </p>
            </li>
          </ul>
          <p className="text-lg text-slate-500 italic mt-8 text-2xl">
            "Bastian versiert Emma om haar familie te kunnen verraden."
          </p>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full">
             <img 
               src={getAssetUrl(stasiImage)} 
               alt="Stasi afluisterapparatuur" 
               className="w-full h-auto rounded-lg shadow-2xl opacity-70"
             />
          </div>
        </div>
      </div>
    </Slide>
  );
}
