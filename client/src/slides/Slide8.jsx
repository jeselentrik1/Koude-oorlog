import Slide from '../components/Slide';
import ussrLogo from '../assets/ussr.svg';

export default function Slide8() {
  return (
    <Slide className="text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex items-center justify-center relative order-2">
          <div className="relative z-10">
             <img src={ussrLogo} alt="USSR Logo" className="w-[450px] h-[450px] object-contain rounded-lg overflow-hidden drop-shadow-[0_20px_50px_rgba(239,68,68,0.3)]" />
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 pr-12 order-1">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Het Oosten</h2>
          <div className="space-y-8 text-2xl text-red-100">
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Leider</span>
              Sovjet-Unie (USSR)
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Ideologie</span>
              Communisme
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Kenmerken</span>
              Controle door de staat, geen tegenstand
            </div>
            <div>
              <span className="font-bold block text-red-400 uppercase text-sm tracking-widest mb-1">Bondgenootschap</span>
              Warschaupact
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
