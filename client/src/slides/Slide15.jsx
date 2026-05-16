import Slide from '../components/Slide';
import familiesImage from '../assets/families.jpg';

export default function Slide15() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="relative w-full">
             <img 
               src={familiesImage} 
               alt="Families gescheiden door de muur" 
               className="w-full h-auto rounded-lg shadow-2xl opacity-70"
             />
          </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <div className="mb-4 text-slate-500 font-bold uppercase tracking-widest text-xl">Muurziek</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Leven in Angst</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Families bruut van elkaar gescheiden.</p>
            <p className="text-white font-bold italic">"De Muurziek"</p>
            <p>Het verstikkende gevoel van opgesloten te zijn in eigen stad.</p>
            <div className="h-px bg-slate-800 my-4" />
            <p className="text-lg text-slate-500 italic">
              "Sepp mag niet naar het trouwfeest van zijn eigen familie."
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
