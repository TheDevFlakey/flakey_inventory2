import { ItemDefinitions } from "../utils/itemDefinitions";

const InventoryWeight: React.FC<{
  items: Item[];
  label: string;
  maxInventoryWeight: number;
}> = ({ items, label, maxInventoryWeight }) => {
  const totalWeight = items.reduce((total, item) => {
    const definition = ItemDefinitions[item.label];
    if (definition && definition.weight) {
      return total + definition.weight * (item.quantity || 1);
    }
    return total;
  }, 0);

  return (
    <div className="flex flex-col mb-2 font-semibold text-xs">
      <div className="flex w-full">
        <h2 className="mb-1">{label}</h2>
        <span className="ml-auto">
          {totalWeight.toFixed(2)} / {maxInventoryWeight}kg
        </span>
      </div>

      <div className="w-full h-2 bg-white/20 overflow-hidden">
        <div
          className="h-full bg-blue-400"
          style={{ width: `${Math.min(totalWeight, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default InventoryWeight;
