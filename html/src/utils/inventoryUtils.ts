export const canPlaceItemAt = (
  x: number,
  y: number,
  item: Item,
  items: Item[],
  inventoryId: number,
  gridWidth: number,
  gridHeight: number
): boolean => {
  if (!item) return false;

  if (x + item.width > gridWidth || y + item.height > gridHeight) return false;

  for (let dx = 0; dx < item.width; dx++) {
    for (let dy = 0; dy < item.height; dy++) {
      const cellX = x + dx;
      const cellY = y + dy;

      const conflictingItem = items.find((other) => {
        if (other.inventoryId !== inventoryId) return false;

        const withinX =
          cellX >= other.gridX && cellX < other.gridX + other.width;
        const withinY =
          cellY >= other.gridY && cellY < other.gridY + other.height;
        if (!withinX || !withinY) return false;

        const isSelf = other.id === item.id;
        if (isSelf) return false;

        const isStackTarget =
          other.label === item.label &&
          other.inventoryId === inventoryId &&
          other.width === (item.originalWidth ?? item.width) &&
          other.height === (item.originalHeight ?? item.height);

        if (isStackTarget) return false;

        return true;
      });

      if (conflictingItem) return false;
    }
  }

  return true;
};
