import Presentation from './components/Presentation';
import PresenterView from './components/PresenterView';
import KahootApp from './kahoot/KahootApp';
import KahootHostTest from './kahoot/KahootHostTest';
import { useState, useEffect, useMemo } from 'react';
import { AssetProvider } from './components/AssetContext';
import coldWarImg from './assets/cold_war.jpeg';
import tensionImg from './assets/tension.jpeg';
import berlinWallImg from './assets/berlin_wall.jpeg';
import nuclearImg from './assets/nuclear.jpeg';
import theEndImg from './assets/the_end.jpg';

// Import all 31 slides
import Slide1 from './slides/Slide1';
import Slide2 from './slides/Slide2';
import Slide3 from './slides/Slide3';
import Slide4 from './slides/Slide4';
import Slide5 from './slides/Slide5';
import Slide6 from './slides/Slide6';
import Slide7 from './slides/Slide7';
import Slide8 from './slides/Slide8';
import Slide9 from './slides/Slide9';
import Slide10 from './slides/Slide10';
import Slide11 from './slides/Slide11';
import Slide12 from './slides/Slide12';
import Slide13 from './slides/Slide13';
import Slide14 from './slides/Slide14';
import Slide15 from './slides/Slide15';
import Slide16 from './slides/Slide16';
import Slide17 from './slides/Slide17';
import Slide18 from './slides/Slide18';
import Slide19 from './slides/Slide19';
import Slide20 from './slides/Slide20';
import Slide21 from './slides/Slide21';
import Slide22 from './slides/Slide22';
import Slide23 from './slides/Slide23';
import Slide24 from './slides/Slide24';
import Slide25 from './slides/Slide25';
import Slide26 from './slides/Slide26';
import Slide27 from './slides/Slide27';
import Slide28 from './slides/Slide28';
import Slide29 from './slides/Slide29';
import Slide30 from './slides/Slide30';
import Slide31 from './slides/Slide31';

// Array of slide components
const slides = [
  Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10,
  Slide11, Slide12, Slide13, Slide14, Slide15, Slide16, Slide17, Slide18, Slide19, Slide20,
  Slide21, Slide22, Slide23, Slide24, Slide25, Slide26, Slide27, Slide28, Slide29, Slide30,
  Slide31
];

// Slide metadata for sequence-based backgrounds
const slideMetadata = {
  0: { isSection: true, background: { image: coldWarImg, brightness: 0.35 } },
  5: { isSection: true, background: { image: tensionImg, brightness: 0.3 } },
  11: { isSection: true, background: { image: berlinWallImg, brightness: 0.52 } },
  16: { isSection: true, background: { image: nuclearImg, brightness: 0.3 } },
  22: { isSection: true, background: { image: theEndImg, brightness: 0.3 } },
  23: { background: { color: '#020202', plain: true } },
};

// Interactive sections to insert between slides
import KahootHost from './kahoot/KahootHost';
import { KahootHostProvider } from './kahoot/KahootHostContext';

const interstitials = [
  // First interstitial is the Lobby before the presentation starts
  { 
    atIndex: 0, 
    component: ({ onComplete }) => <KahootHost isLobby={true} onComplete={onComplete} />
  },
  { 
    atIndex: 6, 
    component: ({ onComplete }) => <KahootHost questionId="q_navo" onComplete={onComplete} />
  },
  { 
    atIndex: 12, 
    component: ({ onComplete }) => <KahootHost questionId="q_berlin_wall" onComplete={onComplete} />
  },
  { 
    atIndex: 19, 
    component: ({ onComplete }) => <KahootHost questionId="q_mi6" onComplete={onComplete} />
  },
  { 
    atIndex: 22, 
    component: ({ onComplete }) => <KahootHost questionId="q_ussr_fall" onComplete={onComplete} />
  },
  { 
    atIndex: 30, 
    component: ({ onComplete }) => <KahootHost questionId="q_bonus" onComplete={onComplete} />
  }
];

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Lightweight slide metadata exposed to the presenter window (name + subslides
  // count). We don't load the full slide React components into the presenter
  // popup since it doesn't render them — it only mirrors them via socket.
  const slidesMeta = useMemo(() => slides.map((SlideComp, idx) => ({
    name: SlideComp?.title || `Slide ${idx + 1}`,
    subslides: Number.isFinite(SlideComp?.subslides) && SlideComp.subslides > 0
      ? Math.floor(SlideComp.subslides)
      : 1,
  })), []);

  let content;
  if (currentPath === '/present/notes') {
    content = <PresenterView slidesMeta={slidesMeta} />;
  } else if (currentPath === '/present') {
    content = (
      <KahootHostProvider>
        <Presentation 
          slides={slides} 
          slideMetadata={slideMetadata}
          interstitials={interstitials}
          navigate={(path) => {
            window.history.pushState({}, '', path);
            setCurrentPath(path);
          }} 
        />
      </KahootHostProvider>
    );
  } else if (currentPath === '/host-test') {
    content = (
      <KahootHostProvider>
        <KahootHostTest />
      </KahootHostProvider>
    );
  } else {
    content = (
      <KahootApp navigate={(path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
      }} />
    );
  }

  return (
    <AssetProvider>
      {content}
    </AssetProvider>
  );
}

export default App;
