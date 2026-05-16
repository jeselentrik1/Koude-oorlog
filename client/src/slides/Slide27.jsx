import Slide from '../components/Slide';
import vrtNwsLogo from '../assets/vrt_nws.png';

export default function Slide27() {
  return (
    <Slide className=" text-white">
      <div className="flex h-full items-center">
        <div className="w-1/2 flex flex-col justify-center pr-12">
          <div className="mb-4 text-blue-500 font-bold uppercase tracking-widest text-xl">VRT NWS // 2024-2026</div>
          <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter">Steadfast Defender</h2>
          <div className="space-y-6 text-2xl text-slate-300">
            <p>Grootste NAVO-oefening sinds de Koude Oorlog.</p>
            <p className="border-l-4 border-blue-600 pl-6 py-2 bg-blue-900/10">
              Locatie: Duitsland en Oost-Europa.
            </p>
            <p>Doel: Tonen dat de NAVO klaar is voor een aanval.</p>
            <p className="text-lg text-slate-500 italic mt-8">
              "Een duidelijke waarschuwing aan het adres van Rusland."
            </p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
           <div className="w-full aspect-[16/10] bg-white text-black rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
              {/* Safari Header */}
              <div className="h-10 bg-[#ebeced] flex items-center px-4 space-x-4 border-b border-gray-300">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-[#ff5f57] rounded-full" />
                  <div className="w-3 h-3 bg-[#ffbd2e] rounded-full" />
                  <div className="w-3 h-3 bg-[#28c840] rounded-full" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-gray-200 rounded-md h-6 w-3/4 flex items-center justify-center space-x-2">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-gray-600 font-medium tracking-tight">vrt.be</span>
                  </div>
                </div>
                <div className="w-12" />
              </div>

              {/* Content Area */}
              <div className="flex-1 bg-white p-8 overflow-hidden">
                <div className="mb-6">
                  <img src={vrtNwsLogo} alt="VRT NWS" className="h-6 object-contain" />
                </div>

                <div className="space-y-6">
                  <h1 className="text-3xl font-black leading-tight text-gray-900">Spierballen rollen en tanden tonen: met operatie "Steadfast Defender" bereidt NAVO zich voor op onzekere toekomst</h1>
                  <div className="flex items-center space-x-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-6 pb-6 border-b border-gray-100">
                    <span>Maarten Bockstaele</span>
                  </div>
                  <p className="text-lg leading-relaxed text-gray-700">
                    Vanaf eind januari tot mei nemen 90.000 soldaten van de NAVO deel aan grootschalige militaire oefeningen: operatie "Steadfast Defender 2024". Het gaat over de grootste operatie sinds het einde van de Koude Oorlog. De NAVO wil tonen dat het verenigd is en de Russische dreiging kan stuiten. Al klinkt de kritiek dat de Westerse oorlogsmachine te traag op gang komt, steeds luider.
                  </p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </Slide>
  );
}
