/** @format */

import React, { useEffect, useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useNuiEvent } from "../hooks/useNuiEvent";
import InventoryGrid from "./InventoryGrid";
import DraggedItem from "./DraggedItem";
import { canPlaceItemAt } from "../utils/inventoryUtils"; // Assuming this function is exported from InventoryGrid
import SplitModal from "./SplitModal"; // Assuming you have a SplitModal component
import InventoryWeight from "./InventoryWeight"; // Assuming you have an InventoryWeight component
import { ItemDefinitions } from "../utils/itemDefinitions";
import InventoryNotifications from "./InventoryNotifications"; // Assuming you have an InventoryNotifications component

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
  durability: number;
  item_id: number;
}

const GRID_WIDTH = 6;
const GRID_HEIGHT = 6;

const App: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitModalPosition, setSplitModalPosition] = useState({ x: 0, y: 0 });
  const [splitItem, setSplitItem] = useState<Item | null>(null);
  const [secondaryId, setSecondaryId] = useState<number | null>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [splittingItem, setSplittingItem] = useState<{
    label: string;
    oldX: number;
    oldY: number;
    oldWidth: number;
    oldHeight: number;
    amount: number;
  } | null>(null);

  useNuiEvent("setInventoryVisible", (data) => {
    setVisible(data.visible);
    setItems(data.items);
  });

  useNuiEvent("setSecondaryId", (data) => {
    setSecondaryId(data.secondaryId);
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
              owner: item.owner,
              secondaryId: secondaryId,
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

    if (splittingItem) {
      // Find items in original cell
      const matchingItems = items.filter(
        (i) =>
          i.gridX === splittingItem.oldX &&
          i.gridY === splittingItem.oldY &&
          i.label === splittingItem.label &&
          i.width === splittingItem.oldWidth &&
          i.height === splittingItem.oldHeight &&
          i.inventoryId === selectedItem?.inventoryId
      );

      if (matchingItems.length < splittingItem.amount) {
        console.warn("Not enough items to split.");
        setSelectedItem(null);
        setSplittingItem(null);
        return;
      }

      const itemToMove = matchingItems[0];

      fetchNui("moveItemSplit", {
        label: itemToMove.label,
        fromX: itemToMove.gridX,
        fromY: itemToMove.gridY,
        fromInventory: itemToMove.inventoryId,
        toX: x,
        toY: y,
        toInventory: inventoryId,
        width: selectedItem.width,
        height: selectedItem.height,
        originalWidth: itemToMove.originalWidth ?? itemToMove.width,
        originalHeight: itemToMove.originalHeight ?? itemToMove.height,
        amount: splittingItem.amount,
        owner: itemToMove.owner,
        secondaryId: secondaryId,
      });

      setSelectedItem(null);
      setSplittingItem(null);
      return;
    }

    const matchingItemInCell = items.find((i) => {
      const sameDimensions =
        (i.width === selectedItem.width && i.height === selectedItem.height) ||
        (i.width === selectedItem.originalWidth &&
          i.height === selectedItem.originalHeight);

      return (
        i.gridX === x &&
        i.gridY === y &&
        i.inventoryId === inventoryId &&
        i.label === selectedItem.label &&
        sameDimensions
      );
    });

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
        owner: selectedItem.owner,
        secondaryId: secondaryId,
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
        owner: selectedItem.owner,
        secondaryId: secondaryId,
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

  const useItem = (item: Item) => {
    fetchNui("useItem", {
      label: item.label,
      gridX: item.gridX,
      gridY: item.gridY,
      inventoryId: item.inventoryId,
      width: item.width,
      height: item.height,
      owner: item.owner,
      id: item.id,
      useEvent: ItemDefinitions[item.item_id]?.useEvent || "",
      removeOnUse: ItemDefinitions[item.item_id]?.removeOnUse || false,
    });
    setSelectedItem(null);
    setShowSplitModal(false);
    setVisible(false);
  };

  return (
    <>
      <InventoryNotifications />
      {visible && (
        <>
          {selectedItem && (
            <DraggedItem
              item={selectedItem}
              position={mousePosition} // You’ll need to track this with `onMouseMove`
              cellSize={92}
            />
          )}
          {showSplitModal && splitItem && (
            <SplitModal
              item={splitItem}
              position={splitModalPosition}
              onCancel={() => setShowSplitModal(false)}
              onUse={() => useItem(splitItem)}
              onConfirm={(amount: number) => {
                setSplittingItem({
                  label: splitItem.label,
                  oldX: splitItem.gridX,
                  oldY: splitItem.gridY,
                  oldWidth: splitItem.width,
                  oldHeight: splitItem.height,
                  amount,
                });
                // setSelectedItem as splitItem but change x and y to -1
                const splitItemCopy = {
                  ...splitItem,
                  gridX: -1,
                  gridY: -1,
                  quantity: amount,
                };
                setSelectedItem(splitItemCopy);
                setShowSplitModal(false);
              }}
            />
          )}
          <div className="min-h-screen bg-black/90 text-white flex items-center p-8 space-x-20 justify-center select-none">
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
                onRightClick={(item, position) => {
                  setSplitItem(item);
                  setShowSplitModal(true);
                  setSplitModalPosition({ x: position.x, y: position.y });
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
                onRightClick={(item, position) => {
                  setSplitItem(item);
                  setShowSplitModal(true);
                  setSplitModalPosition({ x: position.x, y: position.y });
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default App;
