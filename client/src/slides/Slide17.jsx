import Slide from '../components/Slide';

export default function Slide17() {
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
                  <span className="text-red-500 font-bold uppercase">Schiessbefehl:</span> Bevel om te schieten
                </li>
              </ul>
           </div>
           <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col justify-center items-center">
              <div className="text-9xl mb-4">🧱</div>
              <div className="text-sm font-mono text-slate-600 uppercase tracking-widest text-center">
                Muur // Hek // Mijnen // Torens
              </div>
           </div>
        </div>
      </div>
    </Slide>
  );
}
