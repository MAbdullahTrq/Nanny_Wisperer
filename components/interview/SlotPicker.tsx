/**
 * Slot picker for interview page. T8.3 — nanny picks one slot or "None available".
 */

export default function SlotPicker({
  slotLabels,
  onSelect,
  onNoneAvailable,
  disabled,
}: {
  slotLabels: string[];
  onSelect: (index: number) => void;
  onNoneAvailable?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-pastel-black">Choose a time</h3>
      {slotLabels.length === 0 ? (
        <p className="text-sm text-dark-green/80">No slots available</p>
      ) : (
        <ul className="space-y-2">
          {slotLabels.map((label, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={disabled}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-4 py-2 text-left text-sm hover:bg-light-green/30 disabled:opacity-60"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {onNoneAvailable && (
        <div className="mt-4 pt-4 border-t border-light-green/40">
          <button
            type="button"
            onClick={onNoneAvailable}
            disabled={disabled}
            className="text-sm text-dark-green/80 underline hover:text-pastel-black disabled:opacity-60"
          >
            None of these work
          </button>
        </div>
      )}
    </div>
  );
}
