import Cell from './Cell';

export default function Board({ board, onCellClick, winningLine = [], disabled = false }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {board.map((value, index) => (
          <Cell
            key={index}
            value={value}
            onClick={() => onCellClick(index)}
            isWinning={winningLine.includes(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}