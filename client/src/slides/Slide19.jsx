import Slide from '../components/Slide';

export default function Slide19() {
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
           <div className="w-full aspect-square bg-slate-900 border-2 border-red-900/50 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="text-[10rem] z-10">👂</div>
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(220,38,38,0.1)_100%)] animate-pulse" />
           </div>
        </div>
      </div>
    </Slide>
  );
}
