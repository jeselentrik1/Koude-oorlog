import Presentation from './components/Presentation';

// Import all 34 slides
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
import Slide32 from './slides/Slide32';
import Slide33 from './slides/Slide33';
import Slide34 from './slides/Slide34';

// Array of slide components
const slides = [
  Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10,
  Slide11, Slide12, Slide13, Slide14, Slide15, Slide16, Slide17, Slide18, Slide19, Slide20,
  Slide21, Slide22, Slide23, Slide24, Slide25, Slide26, Slide27, Slide28, Slide29, Slide30,
  Slide31, Slide32, Slide33, Slide34
];

function App() {
  return (
    <Presentation slides={slides} />
  );
}

export default App;
