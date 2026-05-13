import Slide from '../components/Slide';

export default function Slide22() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center items-center text-center">
        <h2 className="text-7xl font-black mb-4 uppercase tracking-tighter text-red-600">MAD</h2>
        <div className="text-2xl font-bold uppercase tracking-[0.3em] mb-12 text-slate-500">Mutually Assured Destruction</div>
        
        <div className="flex items-center justify-center space-x-24 w-full max-w-4xl">
           <div className="flex flex-col items-center">
              <div className="text-8xl mb-4">💣</div>
              <div className="text-xl font-black uppercase">USA</div>
           </div>
           
           <div className="flex flex-col items-center w-full">
              <div className="h-1 bg-slate-800 w-full relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-600 rounded-full" />
              </div>
              <div className="mt-8 text-xl text-slate-500 italic">"Gegarandeerde vernietiging aan beide kanten."</div>
           </div>

           <div className="flex flex-col items-center">
              <div className="text-8xl mb-4 grayscale">💣</div>
              <div className="text-xl font-black uppercase">USSR</div>
           </div>
        </div>
        
        <p className="mt-20 text-3xl text-slate-300 max-w-2xl">
          Ironisch genoeg bewaarde deze terreur de vrede: <br/>
          <span className="text-white font-bold italic">Niemand durfde te schieten.</span>
        </p>
      </div>
    </Slide>
  );
}
