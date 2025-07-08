/** @format */

import React, { useEffect, useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useNuiEvent } from "../hooks/useNuiEvent";
import InventoryGrid from "./InventoryGrid";
import DraggedItem from "./DraggedItem";
import { canPlaceItemAt } from "../utils/inventoryUtils"; // Assuming this function is exported from InventoryGrid
import SplitModal from "./SplitModal"; // Assuming you have a SplitModal component
import InventoryWeight from "./InventoryWeight"; // Assuming you have an InventoryWeight component

interface Item {
  id: number;
  label: string;
  gridX: number;
  gridY: number;
  inventoryId: number;
  width: number;
  height: number;
  owner: string;
  originalWidth?: number;
  originalHeight?: number;
}

const GRID_WIDTH = 6;
const GRID_HEIGHT = 6;

const App: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      label: "Chair",
      gridX: 0,
      gridY: 2,
      inventoryId: 1,
      width: 2,
      height: 2,
      owner: "Player",
    },
    {
      id: 2,
      label: "Chair",
      gridX: 0,
      gridY: 5,
      inventoryId: 1,
      width: 2,
      height: 1,
      owner: "Player",
    },
    {
      id: 3,
      label: "Chair",
      gridX: 0,
      gridY: 0,
      inventoryId: 1,
      width: 1,
      height: 1,
      owner: "Player",
    },
    {
      id: 4,
      label: "Chair",
      gridX: 3,
      gridY: 1,
      inventoryId: 1,
      width: 1,
      height: 2,
      owner: "Player",
    },
    {
      id: 5,
      label: "Chair",
      gridX: 3,
      gridY: 1,
      inventoryId: 1,
      width: 1,
      height: 2,
      owner: "Player",
    },
  ]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitItem, setSplitItem] = useState<Item | null>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useNuiEvent("setInventoryVisible", (data) => {
    setVisible(data.visible);
    setItems(data.items);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
        fetchNui("closeInventory", {});
        setSelectedItem(null);
      }

      if (e.key.toLowerCase() === "r") {
        setSelectedItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            width: prev.height,
            height: prev.width,
          };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onItemClick = (item: Item, e?: React.MouseEvent) => {
    console.log("Item clicked:", e);
    if (e?.ctrlKey) {
      const targetInventory = item.inventoryId === 1 ? 2 : 1;

      // Try to find a valid position in the other inventory
      for (let y = 0; y <= GRID_HEIGHT - item.height; y++) {
        for (let x = 0; x <= GRID_WIDTH - item.width; x++) {
          if (
            canPlaceItemAt(
              x,
              y,
              item,
              items,
              targetInventory,
              GRID_WIDTH,
              GRID_HEIGHT
            )
          ) {
            fetchNui("moveItem", {
              label: item.label,
              fromX: item.gridX,
              fromY: item.gridY,
              fromInventory: item.inventoryId,
              toX: x,
              toY: y,
              toInventory: targetInventory,
              width: item.width,
              height: item.height,
              originalWidth: item.originalWidth ?? item.width,
              originalHeight: item.originalHeight ?? item.height,
            });

            setSelectedItem(null);
            return;
          }
        }
      }

      // Optionally show feedback if no space
      console.warn("No valid space found in opposite inventory.");
      return;
    }

    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem({
        ...item,
        originalWidth: item.width,
        originalHeight: item.height,
      });
    }
  };

  const onCellClick = (x: number, y: number, inventoryId: number) => {
    if (!selectedItem) return;

    const valid = canPlaceItemAt(
      x,
      y,
      selectedItem,
      items,
      inventoryId,
      GRID_WIDTH,
      GRID_HEIGHT
    );

    if (!valid) return; // Prevent invalid drop

    const matchingItemInCell = items.find(
      (i) =>
        i.gridX === x &&
        i.gridY === y &&
        i.inventoryId === inventoryId &&
        i.label === selectedItem.label &&
        i.width === selectedItem.width &&
        i.height === selectedItem.height
    );

    if (matchingItemInCell) {
      fetchNui("stackItem", {
        label: selectedItem.label,
        fromX: selectedItem.gridX,
        fromY: selectedItem.gridY,
        fromInventory: selectedItem.inventoryId,
        toX: x,
        toY: y,
        toInventory: inventoryId,
        width: selectedItem.width,
        height: selectedItem.height,
        originalWidth: selectedItem.originalWidth,
        originalHeight: selectedItem.originalHeight,
      });
    } else {
      fetchNui("moveItem", {
        label: selectedItem.label,
        fromX: selectedItem.gridX,
        fromY: selectedItem.gridY,
        fromInventory: selectedItem.inventoryId,
        toX: x,
        toY: y,
        toInventory: inventoryId,
        width: selectedItem.width,
        height: selectedItem.height,
        originalWidth: selectedItem.originalWidth,
        originalHeight: selectedItem.originalHeight,
      });
    }

    setSelectedItem(null);
  };

  const getDisplayItems = (
    inventoryId: number
  ): (Item & { quantity: number })[] => {
    const filtered = items.filter((i) => i.inventoryId === inventoryId);
    const merged: Record<string, Item & { quantity: number }> = {};

    for (const item of filtered) {
      const key = `${item.label}-${item.gridX}-${item.gridY}-${item.width}x${item.height}`;
      if (!merged[key]) {
        merged[key] = { ...item, quantity: 1 };
      } else {
        merged[key].quantity++;
      }
    }

    return Object.values(merged);
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  return (
    visible && (
      <>
        {selectedItem && (
          <DraggedItem
            item={selectedItem}
            position={mousePosition} // You’ll need to track this with `onMouseMove`
            cellSize={64}
          />
        )}
        {showSplitModal && splitItem && (
          <SplitModal
            item={splitItem}
            onCancel={() => setShowSplitModal(false)}
            onConfirm={(amount: number) => {
              fetchNui("splitItem", {
                id: splitItem.id,
                amount,
              });
              setShowSplitModal(false);
            }}
          />
        )}
        <div className="min-h-screen bg-black/50 text-white flex items-center p-8 space-x-20 justify-center select-none">
          <div>
            <InventoryWeight
              items={getDisplayItems(1)}
              label="Player Inventory"
              maxInventoryWeight={100} // Adjust this value as needed
            />
            <InventoryGrid
              inventoryId={1}
              items={getDisplayItems(1)}
              selectedItem={selectedItem}
              onCellClick={onCellClick}
              onItemClick={onItemClick}
              onRightClick={(item) => {
                setSplitItem(item);
                setShowSplitModal(true);
              }}
            />
          </div>
          <div>
            <InventoryWeight
              items={getDisplayItems(2)}
              label="Ground Inventory"
              maxInventoryWeight={200} // Adjust this value as needed
            />
            <InventoryGrid
              inventoryId={2}
              items={getDisplayItems(2)}
              selectedItem={selectedItem}
              onCellClick={onCellClick}
              onItemClick={onItemClick}
            />
          </div>
        </div>
      </>
    )
  );
};

export default App;
