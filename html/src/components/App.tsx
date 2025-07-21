/** @format */

import React, { useEffect, useState } from "react";
import { fetchNui } from "../utils/fetchNui";
import { useNuiEvent } from "../hooks/useNuiEvent";
import InventoryGrid from "./InventoryGrid";
import DraggedItem from "./DraggedItem";
import { canPlaceItemAt } from "../utils/inventoryUtils"; // Assuming this function is exported from InventoryGrid
import SplitModal from "./SplitModal"; // Assuming you have a SplitModal component
import InventoryWeight from "./InventoryWeight"; // Assuming you have an InventoryWeight component
import InventoryNotifications from "./notifications/InventoryNotifications"; // Assuming you have an InventoryNotifications component
import Hotbar from "./Hotbar";

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
  image: string;
  weight: number;
  description: string;
  useEvent?: string;
  removeOnUse?: boolean;
  weaponName?: string;
  ammoType?: string;
  maxStack?: number;
}

const App: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitModalPosition, setSplitModalPosition] = useState({ x: 0, y: 0 });
  const [splitItem, setSplitItem] = useState<Item | null>(null);
  const [secondaryId, setSecondaryId] = useState<number | null>(null);
  const [secondaryMaxWeight, setSecondaryMaxWeight] = useState<number>(250); // Default max weight for secondary inventory
  const [GRID_WIDTH, setGridWidth] = useState(6);
  const [GRID_HEIGHT, setGridHeight] = useState(6);
  const [showStatus, setShowStatus] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [splittingItem, setSplittingItem] = useState<{
    label: string;
    oldX: number;
    oldY: number;
    oldWidth: number;
    oldHeight: number;
    amount: number;
    image: string;
    weight: number;
  } | null>(null);

  useNuiEvent("setInventoryVisible", (data) => {
    setVisible(data.visible);
    setItems(data.items);
  });

  useNuiEvent("setSecondaryMaxWeight", (data) => {
    setSecondaryMaxWeight(data.secondaryMaxWeight || 250);
    setGridWidth(data.secondaryGridSize.width || 6);
    setGridHeight(data.secondaryGridSize.height || 6);
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
    console.log("Item clicked:", item.image);
    if (e?.ctrlKey) {
      const targetInventory =
        item.inventoryId === 1 && showStatus
          ? 69
          : item.inventoryId == 1
          ? 2
          : 1;

      const stackTargets = items.filter((i) => {
        return (
          i.inventoryId === targetInventory &&
          i.label === item.label &&
          i.item_id == item.item_id
        );
      });

      if (stackTargets.length > 0) {
        // You could sort stackTargets here by gridY, gridX or any other priority logic
        const bestStack = stackTargets[0]; // use the first match for now

        fetchNui("moveItem", {
          label: item.label,
          fromX: item.gridX,
          fromY: item.gridY,
          fromInventory: item.inventoryId,
          toX: bestStack.gridX,
          toY: bestStack.gridY,
          toInventory: targetInventory,
          width: bestStack.width,
          height: bestStack.height,
          originalWidth: item.originalWidth ?? item.width,
          originalHeight: item.originalHeight ?? item.height,
          owner: item.owner,
          secondaryId: secondaryId,
        });

        setSelectedItem(null);
        return;
      }

      let TEMP_GRID_WIDTH = GRID_WIDTH;
      let TEMP_GRID_HEIGHT = GRID_HEIGHT;
      if (targetInventory === 1) {
        TEMP_GRID_WIDTH = 6;
        TEMP_GRID_HEIGHT = 12;
      } else {
        TEMP_GRID_WIDTH = GRID_WIDTH;
        TEMP_GRID_HEIGHT = GRID_HEIGHT;
      }

      // Try to find a valid position in the other inventory
      for (let y = 0; y <= TEMP_GRID_HEIGHT - item.height; y++) {
        for (let x = 0; x <= TEMP_GRID_WIDTH - item.width; x++) {
          if (
            canPlaceItemAt(
              x,
              y,
              item,
              items,
              targetInventory,
              TEMP_GRID_WIDTH,
              TEMP_GRID_HEIGHT
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

    let TEMP_GRID_WIDTH = GRID_WIDTH;
    let TEMP_GRID_HEIGHT = GRID_HEIGHT;
    if (inventoryId === 1) {
      TEMP_GRID_WIDTH = 6;
      TEMP_GRID_HEIGHT = 12;
    } else {
      TEMP_GRID_WIDTH = GRID_WIDTH;
      TEMP_GRID_HEIGHT = GRID_HEIGHT;
    }

    const valid = canPlaceItemAt(
      x,
      y,
      selectedItem,
      items,
      inventoryId,
      TEMP_GRID_WIDTH,
      TEMP_GRID_HEIGHT
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
      useEvent: item.useEvent || "",
      removeOnUse: item.removeOnUse || false,
      weaponName: item.weaponName || false,
      ammoType: item.ammoType || false,
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
                  image: splitItem.image,
                  weight: splitItem.weight,
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
          <div className="relative min-h-screen bg-black/90 text-white gap-x-32 flex p-8 select-none">
            <div className="flex w-1/2">
              <div className="my-auto ml-auto">
                <InventoryWeight
                  items={getDisplayItems(1)}
                  label="Player Inventory"
                  maxInventoryWeight={250} // Adjust this value as needed
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
                  gridWidth={6}
                  gridHeight={12}
                />
              </div>
            </div>
            <div className="w-1/2 flex relative">
              <div className="absolute left-0 top-36">
                <button
                  className="flex py-2 px-4 bg-white/10 font-semibold text-sm"
                  onClick={() => setShowStatus(!showStatus)}
                >
                  Toggle Inventory
                </button>
              </div>
              <div className="my-auto mr-auto">
                {showStatus ? (
                  <>
                    <InventoryWeight
                      items={getDisplayItems(69)}
                      label="Ground Inventory"
                      maxInventoryWeight={secondaryMaxWeight} // Adjust this value as needed
                    />

                    <div className="h-[600px] bg-white/5 border border-white/10 w-[552px] p-4 flex flex-col justify-between">
                      {/* Skeleton image */}
                      <div className="flex justify-center items-center h-full">
                        <img
                          src="./images/player_skeleton.png" // Replace with your actual path
                          alt="Player Skeleton"
                          className="h-[400px] opacity-70"
                        />
                      </div>
                      {/* Hotbar slots */}
                      <Hotbar
                        items={getDisplayItems(69)}
                        selectedItem={selectedItem}
                        onCellClick={onCellClick}
                        onItemClick={onItemClick}
                        onRightClick={(item, position) => {
                          setSplitItem(item);
                          setShowSplitModal(true);
                          setSplitModalPosition({
                            x: position.x,
                            y: position.y,
                          });
                        }}
                        inventoryId={69} // Use a unique inventoryId like -2 for hotbar
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <InventoryWeight
                      items={getDisplayItems(2)}
                      label="Ground Inventory"
                      maxInventoryWeight={secondaryMaxWeight} // Adjust this value as needed
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
                      gridWidth={GRID_WIDTH}
                      gridHeight={GRID_HEIGHT}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default App;
