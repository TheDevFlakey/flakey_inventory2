/** @format */

import React from "react";

interface DraggedItemProps {
  item: {
    label: string;
    width: number;
    height: number;
    quantity?: number;
    image: string;
    weight: number;
  };
  position: { x: number; y: number };
  cellSize: number;
}

const DraggedItem: React.FC<DraggedItemProps> = ({
  item,
  position,
  cellSize,
}) => {
  const image = item.image || "";
  const weight = item.weight || 0;

  return (
    <div
      className="pointer-events-none fixed z-50 bg-white/20 text-white text-xs flex flex-col justify-between items-center overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: item.width * cellSize,
        height: item.height * cellSize,
        transform: "translate(-20%, -20%)",
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full p-1">
          <div className="w-[70%] h-[70%] flex items-center justify-center">
            <img
              src={image}
              alt={item.label}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
        </div>
      </div>

      {item.quantity && item.quantity > 1 && (
        <span className="absolute top-1 right-1 text-[10px] text-white bg-black/40 px-1 rounded">
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

      <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/40 px-1 rounded">
        {weight}kg
      </span>
    </div>
  );
};

export default DraggedItem;
