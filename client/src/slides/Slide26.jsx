import Slide from '../components/Slide';

export default function Slide26() {
  return (
    <Slide className=" text-white flex flex-col justify-center items-center">
      <div className="text-red-600 font-bold uppercase tracking-[0.5em] text-2xl mb-8">Nu</div>
      <h2 className="text-8xl font-black uppercase tracking-tighter text-center max-w-5xl">
        Link met de Actualiteit
      </h2>
      <div className="mt-16 h-2 w-48 bg-white/20" />
      <div className="mt-12 flex space-x-8 opacity-40 grayscale">
         <div className="text-2xl font-black border-2 border-white px-4 py-2">VRT NWS</div>
         <div className="text-2xl font-black border-2 border-white px-4 py-2">NAVO</div>
         <div className="text-2xl font-black border-2 border-white px-4 py-2">STEADFAST DEFENDER</div>
      </div>
    </Slide>
  );
}
