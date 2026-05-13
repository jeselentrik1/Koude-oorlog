import Slide from '../components/Slide';

export default function Slide32() {
  return (
    <Slide className=" text-white flex flex-col justify-center items-center text-center">
      <div className="text-red-600 text-9xl mb-8 opacity-50">👁</div>
      <h2 className="text-6xl font-black mb-12 uppercase tracking-tighter">Onze Eigen Visie</h2>
      <div className="space-y-8 text-3xl text-slate-300 max-w-4xl">
        <p>"De wapens zijn veranderd, de angst is gebleven."</p>
        <p className="text-white italic">Digitale muren hebben de betonnen Muur vervangen.</p>
        <p>De geschiedenis lijkt zich te herhalen, maar nu in een onzichtbare, digitale vorm.</p>
        <div className="h-1 w-24 bg-red-600 mx-auto my-12" />
        <p className="text-xl text-slate-500 uppercase tracking-widest font-bold">Informatieoorlog // Paranoia // Verdeeldheid</p>
      </div>
    </Slide>
  );
}
