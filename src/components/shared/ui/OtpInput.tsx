import React, { useMemo } from 'react';

interface OtpInputProps {
  value: string;
  valueLength: number;
  onChange: (value: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, valueLength, onChange }) => {
  const valueItems = useMemo(() => {
    const valueArray = value.split('');
    const items: string[] = [];

    for (let i = 0; i < valueLength; i++) {
      const char = valueArray[i];
      if (new RegExp(/^\d+$/).test(char)) {
        items.push(char);
      } else {
        items.push('');
      }
    }
    return items;
  }, [value, valueLength]);

  const focusToNextInput = (target: HTMLElement) => {
    const nextElementSibling = target.nextElementSibling as HTMLInputElement | null;
    if (nextElementSibling) {
      nextElementSibling.focus();
    }
  };

  const focusToPrevInput = (target: HTMLElement) => {
    const previousElementSibling = target.previousElementSibling as HTMLInputElement | null;
    if (previousElementSibling) {
      previousElementSibling.focus();
    }
  };

  const inputOnChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const target = e.target;
    const targetValue = target.value.trim();
    const isTargetValueDigit = /^\d+$/.test(targetValue);

    if (!isTargetValueDigit && targetValue !== '') {
      return;
    }

    const nextInputVal = targetValue.substring(targetValue.length - 1);
    const nextValue =
      value.substring(0, idx) + nextInputVal + value.substring(idx + 1);

    onChange(nextValue);

    if (!isTargetValueDigit) return;
    focusToNextInput(target);
  };

  const inputOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      return focusToNextInput(target);
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      return focusToPrevInput(target);
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      const targetValue = target.value;
      if (targetValue) {
        onChange(value.substring(0, value.length - 1));
      } else {
        focusToPrevInput(target);
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {valueItems.map((digit, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{1}"
          maxLength={valueLength}
          className="w-10 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold focus:border-gyn-blue-medium focus:ring-2 focus:ring-gyn-blue-medium/30 outline-none transition-all bg-white shadow-sm"
          value={digit}
          onChange={(e) => inputOnChange(e, idx)}
          onKeyDown={inputOnKeyDown}
        />
      ))}
    </div>
  );
};
