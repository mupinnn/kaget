import { useEffect, useState } from "react";

export function usePersistentStorage() {
  const [isStoragePersisted, setIsStoragePersisted] = useState(false);

  useEffect(() => {
    async function checkStoragePersistence() {
      if (navigator.storage && navigator.storage.persisted) {
        const result = await navigator.storage.persisted();
        setIsStoragePersisted(result);
      } else {
        setIsStoragePersisted(false);
      }
    }

    void checkStoragePersistence();
  }, []);

  const requestPersistedStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const result = await navigator.storage.persist();
      setIsStoragePersisted(result);
      return true;
    }

    return false;
  };

  return { isStoragePersisted, requestPersistedStorage };
}
