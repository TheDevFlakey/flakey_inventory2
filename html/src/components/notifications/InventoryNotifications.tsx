import { useNuiEvent } from "../../hooks/useNuiEvent";
import React, { useState } from "react";

interface NotiData {
  id: number;
  label: string;
  item_id: number;
  msg: string;
  image?: string;
}

let uniqueId = 0;

const InventoryNotifications: React.FC = () => {
  const [visibleNotis, setVisibleNotis] = useState<NotiData[]>([]);

  useNuiEvent("showNotification", (data) => {
    const newNoti: NotiData = {
      id: uniqueId++,
      label: data.label,
      item_id: data.item_id,
      msg: data.msg,
      image: data.image,
    };

    setVisibleNotis((prev) => {
      const next = [...prev, newNoti];
      return next.slice(-5); // keep only last 5
    });

    setTimeout(() => {
      setVisibleNotis((prev) => prev.filter((n) => n.id !== newNoti.id));
    }, 2300);
  });

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-row gap-3">
      {visibleNotis.map((noti) => (
        <div
          key={noti.id}
          className={`flex items-center bg-black/90 border border-white/10 text-white px-3 py-2 rounded-md shadow-lg transition-all duration-300 opacity-100 scale-100 transform`}
          style={{ minWidth: "180px" }}
        >
          <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center mr-3 overflow-hidden border border-white/5 p-1">
            {noti.image && (
              <img
                src={noti.image}
                alt={noti.label}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-white leading-tight">
              {noti.label}
            </p>
            <p className="text-xs text-blue-400">{noti.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryNotifications;
