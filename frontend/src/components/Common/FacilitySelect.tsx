import { useFacilities } from '../../hooks/useFacilities';

interface FacilitySelectProps {
  id: string;
  value: string;
  onChange: (facilityId: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

export function FacilitySelect({
  id,
  value,
  onChange,
  required,
  disabled,
  label = 'Facility',
}: FacilitySelectProps) {
  const { facilities, loading, error } = useFacilities();

  return (
    <div>
      <label className="label-field" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="input-field"
        required={required}
        disabled={disabled || loading}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? 'Loading facilities…' : 'Select a facility'}</option>
        {facilities.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.city || f.location ? ` · ${f.city || f.location}` : ''}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-burgundy-400">{error}</p>}
    </div>
  );
}
