import Slide from '../components/Slide';
import conclusionImg from '../assets/conclusion.jpg';
import { useAssetCache } from '../components/AssetContext';

export default function Slide30() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex items-center justify-center p-12">
           <div className="relative">
              <img 
                src={getAssetUrl(conclusionImg)} 
                alt="Conclusion" 
                className="w-full h-auto object-contain rounded-lg" 
              />
           </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter text-white/80">CONCLUSIE</h2>
          <div className="space-y-12 text-3xl text-slate-300">
            <p>Strijd tussen systemen maar de impact was menselijk</p>
            <p>Boeken gaven de kille theorie een <span className="text-white font-bold">menselijk gezicht</span>.</p>
            <div className="h-px bg-slate-800" />
            <p className="text-white font-black uppercase tracking-tighter text-4xl leading-tight">
               Zowel toen als vandaag: <br/>
               De onschuldige burger betaalt de prijs.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
