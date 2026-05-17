import Slide from '../components/Slide';

export default function Slide29() {
  return (
    <Slide className="text-white flex flex-col justify-center items-center text-center">
      <h2 className="text-7xl font-black mb-16 uppercase tracking-tighter leading-none">
        Onze Eigen <span className="text-red-600">Visie</span>
      </h2>

      <div className="space-y-16 w-full px-20">
        <div className="relative inline-block">
          <p className="text-5xl text-white font-medium italic">
            De wapens zijn veranderd, de angst is gebleven.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <p className="text-3xl text-slate-200">
            Digitale muren hebben de betonnen Muur vervangen.
          </p>
          <p className="text-2xl text-slate-400">
            De geschiedenis herhaalt zich in een onzichtbare, digitale vorm.
          </p>
        </div>

        <div className="h-px w-64 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto" />
        
        <div className="flex justify-center items-center space-x-8 text-lg text-slate-500 uppercase tracking-[0.3em] font-bold">
          <span>Informatieoorlog</span>
          <span className="text-red-600 opacity-50">•</span>
          <span>Paranoia</span>
          <span className="text-red-600 opacity-50">•</span>
          <span>Verdeeldheid</span>
        </div>
      </div>
    </Slide>
  );
}
