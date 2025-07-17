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

        // Exclude self or part of same stack
        const isSameItemOrStack =
          other.label === item.label &&
          other.gridX === item.gridX &&
          other.gridY === item.gridY &&
          other.inventoryId === item.inventoryId &&
          ((other.width === item.width && other.height === item.height) ||
            (other.width === item.originalWidth &&
              other.height === item.originalHeight));

        if (isSameItemOrStack) return false;

        // Allow stacking if it exactly matches the placement
        const isValidStackTarget =
          other.label === item.label &&
          other.gridX === x &&
          other.gridY === y &&
          other.inventoryId === inventoryId &&
          other.width === item.width &&
          other.height === item.height;

        if (isValidStackTarget) return false;

        return true; // Conflict
      });

      if (conflictingItem) return false;
    }
  }

  return true;
};
