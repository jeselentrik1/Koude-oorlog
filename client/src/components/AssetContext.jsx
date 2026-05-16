import { createContext, useContext, useState, useCallback } from 'react';

const AssetContext = createContext({
  assetMap: {},
  modelCache: {},
  setAssetMap: () => {},
  setModelCache: () => {},
  getAssetUrl: (url) => url,
  getCachedModel: (url) => null,
});

export const AssetProvider = ({ children }) => {
  const [assetMap, setAssetMap] = useState({}); // originalUrl -> blobUrl
  const [modelCache, setModelCache] = useState({}); // url -> gltf object

  const getAssetUrl = useCallback((url) => {
    return assetMap[url] || url;
  }, [assetMap]);

  const getCachedModel = useCallback((url) => {
    return modelCache[url] || null;
  }, [modelCache]);

  return (
    <AssetContext.Provider value={{ 
      assetMap, 
      modelCache, 
      setAssetMap, 
      setModelCache, 
      getAssetUrl, 
      getCachedModel 
    }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssetCache = () => useContext(AssetContext);
