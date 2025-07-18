import { useNuiEvent } from "../hooks/useNuiEvent";
import React, { useState } from "react";
import { ItemDefinitions } from "../utils/itemDefinitions";

interface UsedItemData {
  visible: boolean;
  label: string;
  item_id: number;
}

const InventoryNotifications: React.FC = () => {
  const [itemUsedNoti, setItemUsedNoti] = useState<UsedItemData>({
    visible: false,
    label: "",
    item_id: 0,
  });

  useNuiEvent("showItemUsedNotification", (data) => {
    setItemUsedNoti({
      visible: true,
      label: data.label,
      item_id: data.item_id,
    });

    const timeout = setTimeout(() => {
      setItemUsedNoti((prev) => ({ ...prev, visible: false }));
    }, 2000);

    return () => clearTimeout(timeout);
  });

  const itemImage = ItemDefinitions[itemUsedNoti.item_id]?.image || "";

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`flex items-center bg-black/90 border border-white/10 text-white px-3 py-2 rounded-md shadow-lg transition-all duration-300 ${
          itemUsedNoti.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } transform`}
        style={{ minWidth: "180px" }}
      >
        <div className="w-16 h-16 bg-white/5 rounded-sm flex items-center justify-center mr-3 overflow-hidden border border-white/5 p-1">
          {itemImage && (
            <img
              src={itemImage}
              alt={itemUsedNoti.label}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-white leading-tight">
            {itemUsedNoti.label}
          </p>
          <p className="text-xs text-blue-400">Used!</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryNotifications;
