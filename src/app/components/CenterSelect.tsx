'use client';

import { useEffect, useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import { Center } from '@/app/types/database';

interface CenterSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export default function CenterSelect({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  allowEmpty = false,
  emptyLabel = 'Select center',
}: CenterSelectProps) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/centers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCenters(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <TextField
      select
      fullWidth
      label={label}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled || loading}
      size="small"
    >
      {allowEmpty && (
        <MenuItem value="">
          <em>{emptyLabel}</em>
        </MenuItem>
      )}
      {centers.map((center) => (
        <MenuItem key={center.id} value={center.id}>
          {center.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
