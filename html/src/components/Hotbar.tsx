import React, { useMemo, useState } from "react";
import InventoryItem from "./InventoryItem";
import { canPlaceItemAt } from "../utils/inventoryUtils";

const CELL_SIZE = 96;

interface Item {
  id: number;
  label: string;
  gridX: number;
  gridY: number;
  inventoryId: number;
  width: number;
  height: number;
  owner: string;
  quantity?: number;
}

interface HotbarProps {
  items: Item[];
  selectedItem: Item | null;
  onCellClick: (x: number, y: number, inventoryId: number) => void;
  onItemClick: (item: Item) => void;
  onRightClick: (item: Item, position: { x: number; y: number }) => void;
  inventoryId: number;
}

const Hotbar: React.FC<HotbarProps> = ({
  items,
  selectedItem,
  onCellClick,
  onItemClick,
  onRightClick,
  inventoryId,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const ghostPreview = useMemo(() => {
    if (!selectedItem || !hoveredCell) return null;
    const { x, y } = hoveredCell;
    const valid = canPlaceItemAt(x, y, selectedItem, items, inventoryId, 5, 1);
    const preview = [];

    for (let dx = 0; dx < selectedItem.width; dx++) {
      for (let dy = 0; dy < selectedItem.height; dy++) {
        preview.push(
          <div
            key={`ghost-${dx}-${dy}`}
            className={`absolute pointer-events-none ${
              valid ? "bg-blue-400/20" : "bg-red-400/20"
            }`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              top: (y + dy) * CELL_SIZE,
              left: (x + dx) * CELL_SIZE,
            }}
          />
        );
      }
    }

    return preview;
  }, [selectedItem, hoveredCell]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let x = 0; x < 5; x++) {
      const y = 0;
      cells.push(
        <div
          key={`hotbar-${x}-${y}`}
          onClick={() => onCellClick(x, y, inventoryId)}
          onMouseEnter={() => setHoveredCell({ x, y })}
          onMouseLeave={() => setHoveredCell(null)}
          className="border relative bg-white/5 border-white/10"
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            gridColumnStart: x + 1,
            gridRowStart: y + 1,
          }}
        >
          <span className="absolute top-1 left-2 text-xs text-white/80 z-20 text-xs font-semibold">
            {x + 1}
          </span>
        </div>
      );
    }
    return cells;
  }, [onCellClick, inventoryId]);

  const renderedItems = items
    .filter((item) => item.inventoryId === inventoryId)
    .map((item) => (
      <InventoryItem
        key={item.id}
        item={item}
        selectedItem={selectedItem}
        isDragging={!!selectedItem}
        onItemClick={onItemClick}
        onRightClick={onRightClick}
        cellSize={CELL_SIZE}
      />
    ));

  return (
    <div
      className="relative flex justify-center items-center mx-auto"
      style={{
        width: 5 * CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(5, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(1, ${CELL_SIZE}px)`,
        }}
      >
        {gridCells}
      </div>
      {ghostPreview}
      {renderedItems}
    </div>
  );
};

export default Hotbar;
