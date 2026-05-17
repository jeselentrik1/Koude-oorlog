import Slide from '../components/Slide';
import childrenImg from '../assets/children.webp';
import { useAssetCache } from '../components/AssetContext';

export default function Slide22() {
  const { getAssetUrl } = useAssetCache();
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-red-600 font-bold uppercase tracking-widest text-xl">Een erfenis van spionnen</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Nasleep</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Mensenlevens hadden vaak geen waarde voor de diensten.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="text-white font-bold">Generatietrauma.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Kinderen eisen decennia later antwoorden over hun ouders.</p>
            </li>
          </ul>
          <p className="border-l-4 border-red-600 pl-6 py-2 bg-red-900/10 italic mt-8 text-lg text-slate-500">
            De gevolgen van geheime missies blijven generaties lang voelbaar bij de nabestaanden.
          </p>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
           <div className="relative">
              <img 
                src={getAssetUrl(childrenImg)} 
                alt="Children" 
                className="w-full h-auto object-contain rounded-lg" 
              />
           </div>
        </div>
      </div>
    </Slide>
  );
}
