import Slide from '../components/Slide';

export default function Slide14() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full aspect-square bg-slate-900 border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
            <div className="text-[10rem] mb-4 opacity-50">🎸</div>
            <div className="text-2xl font-bold text-slate-500 uppercase tracking-widest">PETER</div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <div className="mb-4 text-red-600 font-bold uppercase tracking-widest text-xl">Heldere hemel</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Menselijke Tol</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Slecht onderhoud in de Sovjet-Unie.</p>
            <p>Het toestel stort neer in Kortrijk.</p>
            <p className="text-white font-bold text-3xl">
              Slachtoffer: Peter, een 19-jarige tiener.
            </p>
            <p className="italic text-slate-500 mt-8">
              "De grote wereldpolitiek stort letterlijk neer op de kamer van een onschuldige jongen."
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
