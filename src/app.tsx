import CustomScrollbar from './components/scrollbar/custom-scrollbar';
import { TransfusionProtocol } from './components/transfusion-protocol/transfusion-protocol';
import { usePersistedTextareaSizes } from './use-persisted-textarea-sizes';

const App = () => {
  usePersistedTextareaSizes();

  return (
    <>
      <TransfusionProtocol />
      <CustomScrollbar />
    </>
  );
};

export default App;
