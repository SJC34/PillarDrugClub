export function formatDateInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Format as MM/DD/YYYY
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

export function handleDateInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void
) {
  const formatted = formatDateInput(e.target.value);
  onChange(formatted);
}
