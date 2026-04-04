import { Separator } from 'react-resizable-panels'

interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical'
}

export default function ResizeHandle({ direction = 'horizontal' }: ResizeHandleProps) {
  const isVertical = direction === 'vertical'

  return (
    <Separator
      className={`group relative flex items-center justify-center
        ${isVertical ? 'h-2 cursor-row-resize' : 'w-2 cursor-col-resize'}
        bg-dark-600/50 hover:bg-accent-blue/20 active:bg-accent-blue/30
        transition-colors duration-150`}
    >
      <div className={`flex ${isVertical ? 'flex-row gap-1' : 'flex-col gap-1'}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-gray-500 group-hover:bg-accent-blue transition-colors"
          />
        ))}
      </div>
    </Separator>
  )
}
