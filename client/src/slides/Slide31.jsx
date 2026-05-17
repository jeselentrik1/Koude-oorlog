import Slide from '../components/Slide';

export default function Slide31() {
  return (
    <Slide className=" text-white flex flex-col justify-center items-center text-center">
      <div className="max-w-4xl">
        <h2 className="text-8xl font-black mb-4 uppercase tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
          Bedankt!
        </h2>
        <div className="h-2 w-32 bg-red-700 mx-auto mb-12 shadow-lg" />
        <p className="text-4xl font-light text-slate-400 mb-20 italic">
          Zijn er nog vragen?
        </p>
        <div className="flex justify-center space-x-12 text-2xl font-black tracking-[0.3em] text-slate-500 uppercase">
          <span>Jess</span>
          <span>Nour</span>
          <span>Thibo</span>
        </div>
      </div>
    </Slide>
  );
}
