import Slide from '../components/Slide';

export default function Slide25() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <div className="flex items-end space-x-8 mb-12">
           <h2 className="text-[12rem] font-black leading-none text-white tracking-tighter">1989</h2>
           <div className="flex flex-col pb-4">
              <span className="text-4xl font-bold uppercase tracking-widest text-red-600">De Val</span>
              <span className="text-2xl text-slate-500 italic">van de Muur</span>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-16">
           <div className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                 <h3 className="text-2xl font-bold mb-4 text-white uppercase tracking-wider">Michail Gorbatsjov</h3>
                 <ul className="space-y-4">
                    <li className="flex items-center">
                       <span className="text-red-500 mr-4 font-black">&gt;</span>
                       <span className="text-xl"><span className="font-bold">Perestrojka</span> (Economische hervorming)</span>
                    </li>
                    <li className="flex items-center">
                       <span className="text-red-500 mr-4 font-black">&gt;</span>
                       <span className="text-xl"><span className="font-bold">Glasnost</span> (Openheid & Vrijheid)</span>
                    </li>
                 </ul>
              </div>
           </div>
           
           <div className="flex flex-col justify-center space-y-6 text-2xl text-slate-400">
              <p>Massale protesten leiden tot de opening van de grenzen.</p>
              <p className="text-white font-bold italic">Einde Sovjet-Unie in 1991.</p>
              <div className="h-px bg-slate-800" />
              <p className="text-lg text-slate-500">
                Journalist Jef (uit <span className="italic">Muurziek</span>) ziet hoe Oost en West elkaar weer in de armen vallen.
              </p>
           </div>
        </div>
      </div>
    </Slide>
  );
}
