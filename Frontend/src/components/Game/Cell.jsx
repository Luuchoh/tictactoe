export default function Cell({ value, onClick, isWinning, disabled }) {
  const getColorClass = () => {
    if (!value) return '';
    return value === 'X' ? 'text-blue-400' : 'text-pink-400';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        aspect-square rounded-xl text-5xl font-bold
        transition-all duration-300 transform
        ${value ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20 hover:scale-105'}
        ${isWinning ? 'bg-yellow-500/30 ring-2 ring-yellow-400' : ''}
        ${!disabled && !value ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${getColorClass()}
        disabled:opacity-50
      `}
    >
      {value}
    </button>
  );
}