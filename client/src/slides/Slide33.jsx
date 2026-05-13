import Slide from '../components/Slide';

export default function Slide33() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex items-center justify-center p-12">
           <div className="relative">
              <div className="text-[15rem] grayscale opacity-30">🥀</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                 <div className="text-5xl font-black text-white/80 uppercase tracking-tighter mix-blend-difference">CONCLUSIE</div>
              </div>
           </div>
        </div>
        <div className="w-1/2 flex flex-col justify-center pl-12 border-l border-slate-800">
          <div className="space-y-12 text-3xl text-slate-300">
            <p>Geen directe strijd, wél miljoenen slachtoffers.</p>
            <p>Boeken gaven de kille theorie een <span className="text-white font-bold">menselijk gezicht</span>.</p>
            <div className="h-px bg-slate-800" />
            <p className="text-white font-black uppercase tracking-tighter text-4xl leading-tight">
               Zowel toen als vandaag: <br/>
               De onschuldige burger betaalt de prijs.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
