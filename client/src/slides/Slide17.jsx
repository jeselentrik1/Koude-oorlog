import Slide from '../components/Slide';
import nuclearImg from '../assets/nuclear.jpeg';

export default function Slide17() {
  return (
    <Slide
      background={{ image: nuclearImg, brightness: 0.3 }}
      className="text-white flex flex-col justify-center items-center"
    >
      <div className="relative z-10 text-center">
        <div className="text-red-600 font-bold uppercase tracking-[0.5em] text-2xl mb-8 drop-shadow-md">
          Deel 3
        </div>
        <h2 className="text-8xl font-black uppercase tracking-tighter max-w-5xl drop-shadow-2xl">
          Een Oorlog Zonder Wapens
        </h2>
        <div className="mt-16 h-2 w-48 bg-red-600/90 mx-auto shadow-lg" />
      </div>
    </Slide>
  );
}
