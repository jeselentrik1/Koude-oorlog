import Slide from '../components/Slide';
import wimImage from '../assets/wim_delaere.jpg';
import { useAssetCache } from '../components/AssetContext';

export default function Slide11() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="flex items-center justify-center p-12">
          <div className="relative w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <img 
              src={getAssetUrl(wimImage)} 
              alt="Wim Delaere" 
              className="w-auto h-250"
            />
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <div className="mb-4 text-red-600 font-bold uppercase tracking-widest text-xl">Heldere hemel</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Menselijke Tol</h2>
          <ul className="space-y-6 text-2xl text-slate-300 mb-8">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Slecht onderhoud in de Sovjet-Unie.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Het toestel stort neer in Kortrijk.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="text-white font-bold text-3xl">
                Slachtoffer: Wim Delaere, een 19-jarige tiener.
              </p>
            </li>
          </ul>
          <p className="italic text-slate-500 mt-8 text-2xl">
            "De grote wereldpolitiek stort letterlijk neer op de kamer van een onschuldige jongen."
          </p>
        </div>
      </div>
    </Slide>
  );
}
