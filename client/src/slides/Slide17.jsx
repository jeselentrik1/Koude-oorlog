import Slide from '../components/Slide';
import nuclearImg from '../assets/nuclear.jpeg';

export default function Slide17() {
  return (
    <Slide
      background={{ image: nuclearImg, brightness: 0.3 }}
      className="text-white flex flex-col justify-center items-center text-center"
    >
      <div className="relative z-10">
        <div className="text-red-600 font-bold uppercase tracking-[0.5em] text-2xl mb-8 drop-shadow-md">
          Deel 3
        </div>
        <h2 className="text-8xl font-black uppercase tracking-tighter max-w-5xl drop-shadow-2xl">
          Een Oorlog Zonder Wapens
        </h2>
        <div className="mt-16 h-1.5 w-32 bg-red-700 mx-auto shadow-lg" />
      </div>

      {/* Industrial decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full border-[20px] border-white/5 pointer-events-none" />
      <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-white/20" />
      <div className="absolute top-12 right-12 w-12 h-12 border-t-2 border-r-2 border-white/20" />
      <div className="absolute bottom-12 left-12 w-12 h-12 border-b-2 border-l-2 border-white/20" />
      <div className="absolute bottom-12 right-12 w-12 h-12 border-b-2 border-r-2 border-white/20" />
    </Slide>
  );
}
