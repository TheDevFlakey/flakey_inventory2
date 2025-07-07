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

  // Prevent overflow outside grid bounds
  if (x + item.width > gridWidth || y + item.height > gridHeight) return false;

  for (let dx = 0; dx < item.width; dx++) {
    for (let dy = 0; dy < item.height; dy++) {
      const cellX = x + dx;
      const cellY = y + dy;

      const conflictingItem = items.find((other) => {
        if (other.inventoryId !== inventoryId) return false;
        const isSelfOrSameStack =
          other.id === item.id ||
          (other.label === item.label &&
            other.width === item.width &&
            other.height === item.height &&
            other.gridX === item.gridX &&
            other.gridY === item.gridY &&
            other.inventoryId === inventoryId);

        if (isSelfOrSameStack) return false;

        const withinX =
          cellX >= other.gridX && cellX < other.gridX + other.width;
        const withinY =
          cellY >= other.gridY && cellY < other.gridY + other.height;

        return withinX && withinY;
      });

      if (conflictingItem) return false;
    }
  }

  return true;
};
