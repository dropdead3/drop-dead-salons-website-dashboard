import { motion } from 'framer-motion';
import { Delete, CornerDownLeft } from 'lucide-react';

interface KioskNumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  accentColor?: string;
  textColor?: string;
}

export function KioskNumberPad({
  value,
  onChange,
  onSubmit,
  maxLength = 10,
  accentColor = '#8B5CF6',
  textColor = '#FFFFFF',
}: KioskNumberPadProps) {
  const handleDigit = (digit: string) => {
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const buttonClass = `
    flex items-center justify-center
    w-20 h-20 md:w-24 md:h-24
    rounded-2xl
    text-3xl md:text-4xl font-medium
    transition-all duration-150
    active:scale-95
  `;

  const digitButtonStyle = {
    backgroundColor: `${textColor}10`,
    color: textColor,
  };

  const actionButtonStyle = {
    backgroundColor: `${accentColor}30`,
    color: accentColor,
  };

  const submitButtonStyle = {
    backgroundColor: accentColor,
    color: '#FFFFFF',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Number pad grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <motion.button
            key={digit}
            className={buttonClass}
            style={digitButtonStyle}
            onClick={() => handleDigit(digit)}
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            {digit}
          </motion.button>
        ))}

        {/* Bottom row: Clear, 0, Delete */}
        <motion.button
          className={buttonClass}
          style={actionButtonStyle}
          onClick={handleClear}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          <span className="text-lg">Clear</span>
        </motion.button>

        <motion.button
          className={buttonClass}
          style={digitButtonStyle}
          onClick={() => handleDigit('0')}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          0
        </motion.button>

        <motion.button
          className={buttonClass}
          style={actionButtonStyle}
          onClick={handleDelete}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          <Delete className="w-8 h-8" />
        </motion.button>
      </div>

      {/* Submit button */}
      <motion.button
        className={`
          flex items-center justify-center gap-3
          w-full max-w-xs
          py-5 px-8
          rounded-2xl
          text-2xl font-semibold
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={submitButtonStyle}
        onClick={onSubmit}
        disabled={value.length < 4}
        whileTap={{ scale: value.length >= 4 ? 0.98 : 1 }}
        type="button"
      >
        <span>Check In</span>
        <CornerDownLeft className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
