import Slide from '../components/Slide';
import migImage from '../assets/mig_23.jpg';

export default function Slide10() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-red-600 font-bold uppercase tracking-widest text-xl">Heldere hemel</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Absurditeit</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Onbemande MiG-23 in Belgisch luchtruim (1989).</p>
            <p className="border-l-4 border-red-600 pl-6 py-2 bg-red-900/10 italic">
              Paniek bij de NAVO: Is dit een provocatie? Start van WOIII?
            </p>
            <p>Extreme paranoia door decennia van wantrouwen.</p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full bg-slate-900 border border-slate-800 transform -rotate-2 overflow-hidden">
            <img 
              src={migImage} 
              alt="MiG-23" 
              className="w-full h-auto"
            />
            <div className="absolute bottom-4 right-4 text-white/70 font-mono text-sm bg-black/50 px-2 py-1 backdrop-blur-sm">MIG-23 // SOVIET AIR FORCE</div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
