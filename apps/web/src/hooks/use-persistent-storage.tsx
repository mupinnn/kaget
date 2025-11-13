import { useEffect, useState } from "react";
import { toast } from "./use-toast";

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

      if (!result) {
        toast({
          duration: 10_000,
          variant: "destructive",
          title: "Storage is not persisted",
          description: (
            <div className="space-y-1">
              <p>
                We tried to enable persistent storage, but your browser did not grant permission.
              </p>
              <ul className="list-disc space-y-1 ps-4">
                <li>
                  If you&apos;re using Firefox, you may see a pop-up requesting permission. Allow
                  it.
                </li>
                <li>
                  On Chromium-based browsers (Chrome, Edge, Brave, etc.), storage persistence is
                  granted automatically based on usage patterns:
                  <ul className="mt-1 list-disc space-y-1 ps-6">
                    <li>Use this app frequently.</li>
                    <li>Add it to your home screen.</li>
                    <li>Interact with the app regularly.</li>
                  </ul>
                </li>
              </ul>
            </div>
          ),
        });
      }

      return true;
    }

    toast({ title: "Storage persistence is not supported in your browser" });

    return false;
  };

  return { isStoragePersisted, requestPersistedStorage };
}
