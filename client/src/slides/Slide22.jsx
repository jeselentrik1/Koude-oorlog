import Slide from '../components/Slide';

export default function Slide22() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-blue-600 font-bold uppercase tracking-widest text-xl">Een erfenis van spionnen</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">De Nasleep</h2>
          <ul className="space-y-6 text-2xl text-slate-300">
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Mensenlevens hadden vaak geen waarde voor de diensten.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p className="text-white font-bold">Generatietrauma.</p>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-4 font-black">&gt;</span>
              <p>Kinderen eisen decennia later antwoorden over hun ouders.</p>
            </li>
          </ul>
          <p className="border-l-4 border-blue-600 pl-6 py-2 bg-blue-900/10 italic mt-8 text-lg text-slate-500">
            De gevolgen van geheime missies blijven generaties lang voelbaar bij de nabestaanden.
          </p>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
           <div className="relative">
              <div className="text-[10rem] opacity-20">👥</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-px bg-red-600 rotate-45" />
           </div>
        </div>
      </div>
    </Slide>
  );
}
