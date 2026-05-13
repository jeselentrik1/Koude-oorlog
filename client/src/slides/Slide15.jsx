import Slide from '../components/Slide';
import berlinWallImg from '../assets/berlin_wall.jpeg';

export default function Slide15() {
  return (
    <Slide 
      background={{ image: berlinWallImg, brightness: 0.52 }}
      className="text-white flex flex-col justify-center items-center"
    >
      <div className="relative z-10 text-center">
        <div className="text-red-700 font-black uppercase tracking-[0.6em] text-2xl mb-8 drop-shadow-md">Deel 2</div>
        <h2 className="text-8xl font-black uppercase tracking-tighter max-w-5xl drop-shadow-2xl">
          De Berlijnse Muur
        </h2>
        <div className="mt-16 h-3 w-64 bg-white/10 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-red-800/50" />
        </div>
      </div>

      {/* Industrial framing */}
      <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
      <div className="absolute inset-0 border border-white/5 pointer-events-none" />
    </Slide>
  );
}
