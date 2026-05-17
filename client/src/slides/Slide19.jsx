import Slide from '../components/Slide';
import usFlag from '../assets/us.webp';
import ussrFlag from '../assets/ussr.png';
import { useAssetCache } from '../components/AssetContext';

export default function Slide19() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center items-center text-center">
        <h2 className="text-7xl font-black mb-4 uppercase tracking-tighter text-red-600">MAD</h2>
        <div className="text-2xl font-bold uppercase tracking-[0.3em] mb-12 text-white">
          <span className="text-red-600">M</span>utually <span className="text-red-600">A</span>ssured <span className="text-red-600">D</span>estruction
        </div>
        
        <div className="flex items-center justify-center space-x-24 w-full max-w-4xl">
           <div className="flex flex-col items-center">
              <img src={getAssetUrl(usFlag)} alt="USA Flag" className="w-40 h-auto object-contain mb-4 shadow-2xl rounded-lg" />
              <div className="text-xl font-black uppercase">USA</div>
           </div>
           
           <div className="flex flex-col items-center w-full">
              <div className="h-1 bg-slate-800 w-full relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-600 rounded-full" />
              </div>
              <div className="mt-8 text-xl text-slate-500 italic">"Gegarandeerde vernietiging aan beide kanten."</div>
           </div>

           <div className="flex flex-col items-center">
              <img src={getAssetUrl(ussrFlag)} alt="USSR Flag" className="w-32 h-auto object-contain mb-4 shadow-2xl rounded-lg" />
              <div className="text-xl font-black uppercase">USSR</div>
           </div>
        </div>
        
        <p className="mt-20 text-3xl text-slate-300 w-full">
          Ironisch genoeg bewaarde deze terreur de vrede: <br/>
          <span className="text-white font-bold italic">Niemand durfde te schieten.</span>
        </p>
      </div>
    </Slide>
  );
}
