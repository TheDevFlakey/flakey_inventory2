/** @format */

import React, { useState } from "react";
import { ItemDefinitions } from "../utils/itemDefinitions";

interface Item {
  id: number;
  label: string;
  gridX: number;
  gridY: number;
  inventoryId: number;
  width: number;
  height: number;
  owner: string;
  durability: number;
  quantity?: number;
}

interface InventoryItemProps {
  item: Item;
  selectedItem: Item | null;
  isDragging: boolean;
  onItemClick: (item: Item, e: React.MouseEvent) => void;
  onRightClick: (item: Item, position: { x: number; y: number }) => void;
  cellSize: number;
}

const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  selectedItem,
  isDragging,
  onItemClick,
  onRightClick,
  cellSize,
}) => {
  const isSelected = selectedItem?.id === item.id;
  const isOtherItem = isDragging && !isSelected;

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`absolute bg-white/20 text-white flex flex-col justify-between overflow-hidden items-center text-xs ${
        isSelected ? "ring-[1.5px] ring-blue-400 select-none" : ""
      }`}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onItemClick(item, e);
      }}
      onMouseDown={(e) => {
        if (e.button === 2) {
          e.preventDefault();
          if (!isDragging && item.quantity && item.quantity > 1) {
            onRightClick(item, { x: e.clientX, y: e.clientY });
          }
        }
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={(e) => {
        if (!selectedItem) {
          setTooltipPos({ x: e.clientX + 10, y: e.clientY + 10 });
        }
      }}
      style={{
        width: `${item.width * cellSize}px`,
        height: `${item.height * cellSize}px`,
        top: item.gridY * cellSize,
        left: item.gridX * cellSize,
        position: "absolute",
        opacity: isOtherItem ? 0.5 : 1,
        pointerEvents: isDragging ? "none" : "auto",
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full p-1">
          <div className="w-[70%] h-[70%] flex items-center justify-center">
            <img
              src={ItemDefinitions[item.label]?.image || ""}
              alt={item.label}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
        </div>
      </div>
      {item.quantity && item.quantity > 1 && (
        <span className="absolute top-1 right-1 text-[10px] text-white bg-black/40 px-1 rounded-sm">
          x{item.quantity}
        </span>
      )}
      {/* Durability bar */}
      <div
        className={`absolute bottom-0 left-0 h-full w-[4px] bg-black/40 ${
          item.durability > 60
            ? "bg-blue-400"
            : item.durability > 30
            ? "bg-yellow-400"
            : "bg-red-400"
        }`}
        style={{
          height: `${(item.durability / 100) * 100}%`,
        }}
      ></div>
      <span className="absolute bottom-1 left-2 text-[10px] text-white bg-black/40 px-1 rounded-sm">
        {(
          (ItemDefinitions[item.label]?.weight ?? 0) * (item.quantity || 1)
        ).toFixed(2)}
        kg
      </span>
      <div
        className={`fixed pointer-events-none transition-opacity duration-200 z-10 ${
          showTooltip ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: tooltipPos.y, left: tooltipPos.x }}
      >
        <div className="bg-black/90 flex flex-col text-white text-[11px] px-2 py-1 rounded shadow-lg border border-white/10 whitespace-nowrap">
          <div className="font-bold">
            {item.quantity || 1}x {item.label}
          </div>
          {ItemDefinitions[item.label]?.description && (
            <div className="text-white/70">
              {ItemDefinitions[item.label]?.description}
            </div>
          )}
          <div className="text-white/70">
            {(
              (ItemDefinitions[item.label]?.weight ?? 0) * (item.quantity || 1)
            ).toFixed(2)}
            kg
          </div>
          <div className="text-white/70">Durability: {item.durability}%</div>
        </div>
      </div>
    </div>
  );
};

export default InventoryItem;
