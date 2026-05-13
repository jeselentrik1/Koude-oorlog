import Slide from '../components/Slide';

export default function Slide12() {
  return (
    <Slide className=" text-white">
      <div className="flex flex-col h-full justify-center">
        <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter text-slate-200">Het IJzeren Gordijn</h2>
        <div className="flex space-x-16">
          <div className="w-1/2 text-2xl text-slate-400 space-y-8">
            <p>
              "An <span className="text-white italic">iron curtain</span> has descended across the Continent."
              <br/>
              <span className="text-sm uppercase tracking-widest text-slate-600">— Winston Churchill</span>
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                Fysieke en ideologische grens door Europa
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                Constant wantrouwen tussen beide blokken
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-4" />
                Onoverbrugbare kloof tussen burgers
              </li>
            </ul>
          </div>
          <div className="w-1/2 flex items-center justify-center">
            <div className="relative w-full aspect-video bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-20">
                 <div className="h-full w-1 bg-red-600 absolute left-1/2 -translate-x-1/2 shadow-[0_0_20px_rgba(220,38,38,1)]" />
               </div>
               <div className="flex justify-between w-full px-12 text-4xl font-black opacity-40">
                  <span>WEST</span>
                  <span>OOST</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}
