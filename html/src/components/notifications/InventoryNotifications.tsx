import { useNuiEvent } from "../../hooks/useNuiEvent";
import React, { useEffect, useRef, useState } from "react";
import { ItemDefinitions } from "../../utils/itemDefinitions";

interface NotiData {
  label: string;
  item_id: number;
  msg: string;
}

const InventoryNotifications: React.FC = () => {
  const [queue, setQueue] = useState<NotiData[]>([]);
  const [current, setCurrent] = useState<NotiData | null>(null);
  const [visible, setVisible] = useState(false);
  const isProcessingRef = useRef(false);

  useNuiEvent("showNotification", (data) => {
    setQueue((prev) => [
      ...prev,
      {
        label: data.label,
        item_id: data.item_id,
        msg: data.msg,
      },
    ]);
  });

  const processQueue = async () => {
    if (isProcessingRef.current || queue.length === 0 || current) return;

    isProcessingRef.current = true;
    const next = queue[0];

    setCurrent(next);
    setVisible(true);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // visible duration
    setVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 300)); // transition duration

    setQueue((prev) => prev.slice(1));
    setCurrent(null);
    isProcessingRef.current = false;
  };

  useEffect(() => {
    if (!isProcessingRef.current && queue.length > 0 && !current) {
      processQueue();
    }
  }, [queue, current]);

  const itemImage = current ? ItemDefinitions[current.item_id]?.image : "";

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
      {current && (
        <div
          className={`flex items-center bg-black/90 border border-white/10 text-white px-3 py-2 rounded-md shadow-lg transition-all duration-300 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          } transform`}
          style={{ minWidth: "180px" }}
        >
          <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center mr-3 overflow-hidden border border-white/5 p-1">
            {itemImage && (
              <img
                src={itemImage}
                alt={current.label}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white leading-tight">
              {current.label}
            </p>
            <p className="text-xs text-blue-400">{current.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryNotifications;
