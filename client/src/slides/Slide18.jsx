import Slide from '../components/Slide';
import nuclearImage from '../assets/nuclear_weapon.jpg';
import { useAssetCache } from '../components/AssetContext';

export default function Slide18() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pr-12 border-r border-slate-800">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Waarom "Koud"?</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Geen directe strijd tussen VS en Sovjet-Unie.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="text-white font-bold">De oorzaak: Kernwapens.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Een confrontatie zou het einde van de world betekenen.</p>
            </li>
          </ul>
          <div className="h-px bg-slate-800 my-8" />
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="text-red-500 uppercase tracking-widest font-black">Wapenwedloop</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Miljarden aan uitgaven voor steeds grotere arsenalen.</p>
            </li>
          </ul>
        </div>
        <div className="w-1/2 flex items-center justify-center relative pl-12">
           <div className="relative w-full">
              <img 
                src={getAssetUrl(nuclearImage)} 
                alt="Kernwapen" 
                className="w-full h-auto rounded-lg shadow-2xl opacity-70"
              />
           </div>
        </div>
      </div>
    </Slide>
  );
}
