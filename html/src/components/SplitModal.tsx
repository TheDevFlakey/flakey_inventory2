import React, { useState } from "react";

const SplitModal = ({ item, onConfirm, onCancel }: any) => {
  const [amount, setAmount] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded shadow-md w-64">
        <h2 className="text-lg mb-4">Unstack {item.label}</h2>
        <input
          type="range"
          min={1}
          max={item.quantity - 1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full mb-2"
        />
        <input
          type="number"
          min={1}
          max={item.quantity - 1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full text-black mb-4 p-1"
        />
        <button
          className="bg-emerald-500 px-4 py-1 rounded mr-2"
          onClick={() => onConfirm(amount)}
        >
          Confirm
        </button>
        <button className="bg-red-500 px-4 py-1 rounded" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SplitModal;
