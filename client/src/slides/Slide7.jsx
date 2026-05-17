import Slide from '../components/Slide';
import natoLogo from '../assets/nato.svg';

export default function Slide7() {
  return (
    <Slide className="text-white">
      <div className="flex h-full">
        <div className="w-1/2 flex flex-col justify-center pl-12 pr-12">
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Het Westen</h2>
          <div className="space-y-8 text-2xl text-blue-100">
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Leider</span>
              Verenigde Staten (VS)
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Ideologie</span>
              Kapitalisme & Democratie
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Kenmerken</span>
              Vrije economie, privébezit, verkiezingen
            </div>
            <div>
              <span className="font-bold block text-blue-400 uppercase text-sm tracking-widest mb-1">Bondgenootschap</span>
              NAVO (1949)
            </div>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center relative">
          <div className="relative z-10">
             <img src={natoLogo} alt="NATO Logo" className="w-[450px] h-[450px] object-contain rounded-lg overflow-hidden drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)]" />
          </div>
        </div>
      </div>
    </Slide>
  );
}
