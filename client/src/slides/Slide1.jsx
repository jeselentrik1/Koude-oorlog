import Slide from '../components/Slide';
import coldWarImg from '../assets/cold_war.jpeg';

export default function Slide1() {
  return (
    <Slide 
      background={{ image: coldWarImg, brightness: 0.35 }}
      className="text-white flex flex-col justify-center items-center text-center"
    >
      <div className="max-w-4xl relative z-10">
        <h1 className="text-8xl font-black mb-4 uppercase tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          De Koude Oorlog
        </h1>
        <div className="h-1.5 w-32 bg-red-700 mx-auto mb-8 shadow-lg" />
        <h2 className="text-3xl font-bold text-slate-300 mb-12 tracking-wide uppercase">
          De wereld verdeeld, de mens geraakt
        </h2>
        <div className="flex justify-center space-x-12 text-xl font-bold tracking-[0.3em] text-slate-400 uppercase">
          <span>Jess</span>
          <span>Nour</span>
          <span>Thibo</span>
        </div>
      </div>
      
      {/* Heavy industrial decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full border-[20px] border-white/5 pointer-events-none" />
      <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-white/20" />
      <div className="absolute top-12 right-12 w-12 h-12 border-t-2 border-r-2 border-white/20" />
      <div className="absolute bottom-12 left-12 w-12 h-12 border-b-2 border-l-2 border-white/20" />
      <div className="absolute bottom-12 right-12 w-12 h-12 border-b-2 border-r-2 border-white/20" />
    </Slide>
  );
}
