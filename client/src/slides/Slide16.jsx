import Slide from '../components/Slide';
import stasiImage from '../assets/stasi.webp';

export default function Slide16() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-slate-500 font-bold uppercase tracking-widest text-xl">Muurziek</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Stasi</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p><span className="text-red-500 font-bold">Ministerium für Staatssicherheit:</span> De ogen en oren van de staat.</p>
            <p>Extreme controle door afluisteren.</p>
            <p className="border-l-4 border-slate-500 pl-6 py-2 bg-slate-900/10 italic">
              Niemand was te vertrouwen, zelfs je geliefde niet.
            </p>
            <p className="text-lg text-slate-500 italic mt-8">
              "Bastian versiert Emma om haar familie te kunnen verraden."
            </p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full">
             <img 
               src={stasiImage} 
               alt="Stasi afluisterapparatuur" 
               className="w-full h-auto rounded-lg shadow-2xl opacity-70"
             />
          </div>
        </div>
      </div>
    </Slide>
  );
}
