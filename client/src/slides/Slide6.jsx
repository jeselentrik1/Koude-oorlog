import Slide from '../components/Slide';
import tensionImg from '../assets/tension.jpeg';

export default function Slide6() {
  return (
    <Slide
      background={{ image: tensionImg, brightness: 0.3 }}
      className="text-white flex flex-col justify-center items-center"
    >
      <div className="relative z-10 text-center">
        <div className="text-red-600 font-bold uppercase tracking-[0.5em] text-2xl mb-8 drop-shadow-md">
          Deel 1
        </div>
        <h2 className="text-8xl font-black uppercase tracking-tighter max-w-5xl drop-shadow-2xl">
          Twee Werelden Tegenover Elkaar
        </h2>
        <div className="mt-16 h-2 w-48 bg-white/20 mx-auto" />
      </div>
    </Slide>
  );
}
