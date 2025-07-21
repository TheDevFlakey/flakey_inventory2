/** @format */

import React, { useState, useMemo } from "react";
import { canPlaceItemAt } from "../utils/inventoryUtils";
import InventoryItem from "./InventoryItem";

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

interface InventoryGridProps {
  inventoryId: number;
  items: Item[];
  selectedItem: Item | null;
  onCellClick: (x: number, y: number, inventoryId: number) => void;
  onItemClick: (item: Item) => void;
  onRightClick: (item: Item, position: { x: number; y: number }) => void;
  gridWidth?: number;
  gridHeight?: number;
}

const CELL_SIZE = 92;

const InventoryGrid: React.FC<InventoryGridProps> = ({
  inventoryId,
  items,
  selectedItem,
  onCellClick,
  onItemClick,
  onRightClick,
  gridWidth = 6,
  gridHeight,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const ghostPreview = useMemo(() => {
    if (!selectedItem || !hoveredCell) return null;
    const { x, y } = hoveredCell;
    const valid = canPlaceItemAt(
      x,
      y,
      selectedItem,
      items,
      inventoryId,
      gridWidth,
      gridHeight
    );
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
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        cells.push(
          <div
            key={`${inventoryId}-${x}-${y}`}
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
          />
        );
      }
    }
    return cells;
  }, [gridWidth, gridHeight, inventoryId, onCellClick]);

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
      className="relative max-h-[600px] overflow-auto no-scrollbar"
      style={{
        width: gridWidth * CELL_SIZE,
        height: gridHeight * CELL_SIZE,
      }}
    >
      <div
        className="grid"
        style={{
          width: gridWidth * CELL_SIZE,
          height: gridHeight * CELL_SIZE,
          gridTemplateColumns: `repeat(${gridWidth}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${CELL_SIZE}px)`,
        }}
      >
        {gridCells}
      </div>
      {ghostPreview}
      {renderedItems}
    </div>
  );
};

export default InventoryGrid;
