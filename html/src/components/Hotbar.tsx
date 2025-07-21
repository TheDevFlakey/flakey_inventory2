const Hotbar: React.FC = () => {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="border bg-white/5 border-white/10 flex box-border"
          style={{
            width: 96,
            height: 96,
          }}
        >
          <span className="text-xs text-white/80 mt-1 ml-1">{i + 1}</span>
        </div>
      ))}
    </div>
  );
};

export default Hotbar;
