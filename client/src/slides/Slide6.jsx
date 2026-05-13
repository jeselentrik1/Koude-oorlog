import Slide from '../components/Slide';

export default function Slide6() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/3 flex flex-col items-center justify-center p-12">
           <div className="aspect-[2/3] w-full bg-slate-900 border-2 border-red-600 rounded-lg flex flex-col items-center justify-center p-8 text-center shadow-2xl shadow-red-900/40">
            <div className="text-6xl mb-6">📖</div>
            <div className="text-2xl font-bold text-slate-200 uppercase tracking-tighter">Heldere hemel</div>
            <div className="mt-4 text-lg text-slate-500">Tom Lanoye</div>
          </div>
        </div>
        <div className="w-2/3 flex flex-col justify-center pl-12">
          <div className="mb-4 text-red-600 font-bold uppercase tracking-widest text-xl">Spreker: Jess</div>
          <h2 className="text-6xl font-black mb-8 text-slate-100 uppercase">De onschuldige burger</h2>
          <p className="text-3xl text-slate-400 leading-relaxed max-w-2xl">
            De focus op het onverwachte slachtoffer van het grote conflict.
          </p>
          <div className="mt-12 h-1 w-32 bg-red-600" />
        </div>
      </div>
    </Slide>
  );
}
