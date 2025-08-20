import React from 'react'
import { Input } from "@/components/ui/input"

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange: (date: string) => void;
}

export function DateInput({ onChange, ...props }: DateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    onChange(date);
  };

  return (
    <Input
      type="date"
      onChange={handleChange}
      {...props}
    />
  );
}

