import React, { useState } from "react";

const SplitModal = ({
  item,
  onConfirm,
  onCancel,
  position,
}: {
  item: any;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}) => {
  const [amount, setAmount] = useState(1);

  return (
    <div className="fixed inset-0 z-50">
      {/* Click-blocker */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="absolute bg-black/90 border border-white/10 px-4 py-3 w-56 shadow-md pointer-events-auto"
        style={{
          top: position.y,
          left: position.x,
          transform: "translate(0, 0)",
        }}
      >
        <h2 className="text-white text-sm mb-3 text-center font-semibold">
          Unstack <span className="text-blue-400">{item.label}</span>
        </h2>

        {/* Slider */}
        <div className="mb-3">
          <input
            type="range"
            min={1}
            max={item.quantity}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none outline-none"
            style={{
              WebkitAppearance: "none",
              appearance: "none",
            }}
          />
        </div>

        {/* Number Input */}
        <div className="mb-3">
          <input
            type="number"
            min={1}
            max={item.quantity}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-gray-900 text-white text-sm px-2 py-1 rounded-sm border border-white/10 text-center"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between space-x-2">
          <button
            onClick={() => onConfirm(amount)}
            className="flex-1 bg-blue-400 hover:bg-blue-500 text-white text-sm py-1 rounded-sm transition"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-1 rounded-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Slider Thumb Styles */}
      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
};

export default SplitModal;
