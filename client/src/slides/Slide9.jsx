import Slide from '../components/Slide';
import ironCurtainMap from '../assets/iron_curtain.svg';
import { useAssetCache } from '../components/AssetContext';

export default function Slide9() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pl-12 pr-12">
          <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter text-slate-200">Het IJzeren Gordijn</h2>
          <div className="text-2xl text-slate-400 space-y-8">
            <p>
              "An <span className="text-white italic">iron curtain</span> has descended across the Continent."
              <br/>
              <span className="text-sm uppercase tracking-widest text-slate-600">— Winston Churchill</span>
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <span className="text-red-600 mr-4 font-black">&gt;</span>
                Fysieke en ideologische grens door Europa
              </li>
              <li className="flex items-center">
                <span className="text-red-600 mr-4 font-black">&gt;</span>
                Constant wantrouwen tussen beide blokken
              </li>
              <li className="flex items-center">
                <span className="text-red-600 mr-4 font-black">&gt;</span>
                Onoverbrugbare kloof tussen burgers
              </li>
            </ul>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full rounded-lg overflow-hidden flex items-center justify-center">
             <img src={getAssetUrl(ironCurtainMap)} alt="Iron Curtain Map" className="w-full h-full object-contain opacity-80" />
             <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </Slide>
  );
}
