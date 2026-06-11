import { cn } from "@/lib/utils"

type SliderProps = {
  min?: number
  max?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
  className?: string
}

function Slider({ min = 0, max = 100, step = 1, value, onValueChange, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value?.[0] ?? min}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={cn(
        "w-full h-1.5 cursor-pointer appearance-none rounded-full bg-muted",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5",
        "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
        "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full",
        "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0",
        className,
      )}
    />
  )
}

export { Slider }
