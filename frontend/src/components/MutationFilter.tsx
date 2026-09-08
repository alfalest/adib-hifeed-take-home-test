interface MutationFilterProps {
  type: string;
  search: string;
  onTypeChange: (type: string) => void;
  onSearchChange: (search: string) => void;
}

export default function MutationFilter({ type, search, onTypeChange, onSearchChange }: MutationFilterProps) {
  return (
    <div className="filter-bar">
      <input
        className="filter-input"
        type="text"
        placeholder="🔍 Cari nama pakan atau SKU..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        id="mutation-search"
      />
      <select
        className="filter-select"
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        id="mutation-type-filter"
      >
        <option value="">Semua Tipe</option>
        <option value="INBOUND">↓ Inbound (Masuk)</option>
        <option value="DISPATCH">↑ Dispatch (Keluar)</option>
      </select>
    </div>
  );
}
