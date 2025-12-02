import React, { useRef, useState } from 'react';
import { Layer, PosterConfig, PaperSize, PaperOrientation, Unit } from '../types';
import { clsx } from 'clsx';

interface CanvasWorkspaceProps {
  layers: Layer[];
  config: PosterConfig;
  paperSize: PaperSize;
  selectedLayerId: string | null;
  onLayerSelect: (id: string | null) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  zoom: number;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  layers,
  config,
  paperSize,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  zoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [interaction, setInteraction] = useState<{
    mode: 'none' | 'moving' | 'resizing';
    activeHandle: 'nw' | 'ne' | 'sw' | 'se' | null;
    startMouse: { x: number; y: number };
    startLayer: Layer | null;
  }>({
    mode: 'none',
    activeHandle: null,
    startMouse: { x: 0, y: 0 },
    startLayer: null
  });

  const isInch = config.unit === Unit.INCH;

  // Calculate paper dimensions in current unit
  const paperWidth = isInch ? paperSize.width / 25.4 : paperSize.width;
  const paperHeight = isInch ? paperSize.height / 25.4 : paperSize.height;

  const isPortrait = config.orientation === PaperOrientation.PORTRAIT;
  const pWidth = isPortrait ? paperWidth : paperHeight;
  const pHeight = isPortrait ? paperHeight : paperWidth;
  const printW = pWidth - (config.margin * 2);
  const printH = pHeight - (config.margin * 2);

  // Calculate Poster Visual Size
  let posterDisplayWidth = 0;
  let posterDisplayHeight = 0;
  let cols = 0;
  let rows = 0;

  if (config.mode === 'grid') {
      posterDisplayWidth = config.gridCols * printW;
      posterDisplayHeight = config.gridRows * printH;
      cols = config.gridCols;
      rows = config.gridRows;
  } else {
      posterDisplayWidth = config.targetWidth;
      posterDisplayHeight = config.targetHeight;
      cols = Math.ceil(posterDisplayWidth / printW);
      rows = Math.ceil(posterDisplayHeight / printH);
  }

  // Convert unit to pixels for screen display
  // Base scale: 1mm = 1px. 1in = 25.4px.
  const displayScale = isInch ? 25.4 : 1; 

  // Visual width/height in Logical Pixels (before zoom)
  const visualW = posterDisplayWidth * displayScale;
  const visualH = posterDisplayHeight * displayScale;

  const handleMouseDown = (e: React.MouseEvent, layerId: string, handle: 'nw' | 'ne' | 'sw' | 'se' | null = null) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default browser dragging
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    onLayerSelect(layerId);
    
    setInteraction({
      mode: handle ? 'resizing' : 'moving',
      activeHandle: handle,
      startMouse: { x: e.clientX, y: e.clientY },
      startLayer: { ...layer }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (interaction.mode === 'none' || !interaction.startLayer || !selectedLayerId) return;

    const { startMouse, startLayer, activeHandle } = interaction;
    
    // Calculate movement in logical pixels (compensating for zoom)
    const deltaX = (e.clientX - startMouse.x) / zoom;
    const deltaY = (e.clientY - startMouse.y) / zoom;
    
    // Convert logic pixels to percentages relative to total poster size
    // visualW/visualH represent the full 100% size in logical pixels
    const deltaXPct = deltaX / visualW;
    const deltaYPct = deltaY / visualH;

    if (interaction.mode === 'moving') {
        onLayerUpdate(selectedLayerId, {
            x: startLayer.x + deltaXPct,
            y: startLayer.y + deltaYPct
        });
    } else if (interaction.mode === 'resizing' && activeHandle) {
        let newX = startLayer.x;
        let newY = startLayer.y;
        let newW = startLayer.width;
        let newH = startLayer.height;

        const MIN_SIZE = 0.01; // Minimum 1% size

        // Simple resizing logic (axis-aligned)
        // For rotated layers, this feels a bit slippery but is functional
        switch (activeHandle) {
            case 'se':
                newW = Math.max(MIN_SIZE, startLayer.width + deltaXPct);
                newH = Math.max(MIN_SIZE, startLayer.height + deltaYPct);
                break;
            case 'sw':
                // Dragging Left edge: changes X and Width
                // If we shrink past min size, we clamp X to right edge - min size
                const proposedW_sw = startLayer.width - deltaXPct;
                if (proposedW_sw < MIN_SIZE) {
                    newW = MIN_SIZE;
                    newX = (startLayer.x + startLayer.width) - MIN_SIZE;
                } else {
                    newW = proposedW_sw;
                    newX = startLayer.x + deltaXPct;
                }
                newH = Math.max(MIN_SIZE, startLayer.height + deltaYPct);
                break;
            case 'ne':
                // Dragging Top edge: changes Y and Height
                newW = Math.max(MIN_SIZE, startLayer.width + deltaXPct);
                const proposedH_ne = startLayer.height - deltaYPct;
                if (proposedH_ne < MIN_SIZE) {
                    newH = MIN_SIZE;
                    newY = (startLayer.y + startLayer.height) - MIN_SIZE;
                } else {
                    newH = proposedH_ne;
                    newY = startLayer.y + deltaYPct;
                }
                break;
            case 'nw':
                // Dragging Top-Left: changes X, Y, Width, Height
                const proposedW_nw = startLayer.width - deltaXPct;
                const proposedH_nw = startLayer.height - deltaYPct;

                if (proposedW_nw < MIN_SIZE) {
                    newW = MIN_SIZE;
                    newX = (startLayer.x + startLayer.width) - MIN_SIZE;
                } else {
                    newW = proposedW_nw;
                    newX = startLayer.x + deltaXPct;
                }

                if (proposedH_nw < MIN_SIZE) {
                    newH = MIN_SIZE;
                    newY = (startLayer.y + startLayer.height) - MIN_SIZE;
                } else {
                    newH = proposedH_nw;
                    newY = startLayer.y + deltaYPct;
                }
                break;
        }

        onLayerUpdate(selectedLayerId, {
            x: newX,
            y: newY,
            width: newW,
            height: newH
        });
    }
  };

  const handleMouseUp = () => {
    setInteraction({ mode: 'none', activeHandle: null, startMouse: { x: 0, y: 0 }, startLayer: null });
  };

  return (
    <div 
        className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-8 relative cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => onLayerSelect(null)}
    >
      <div 
        ref={containerRef}
        className="relative bg-white shadow-2xl transition-transform duration-75 ease-linear origin-center"
        style={{
            width: `${visualW}px`,
            height: `${visualH}px`,
            transform: `scale(${zoom})`,
            backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Render Layers */}
        {layers.map(layer => {
            const isSelected = selectedLayerId === layer.id;
            const isText = layer.type === 'text';
            
            return (
                <div
                    key={layer.id}
                    onMouseDown={(e) => handleMouseDown(e, layer.id)}
                    className={clsx(
                        "absolute group",
                        isSelected ? "ring-2 ring-blue-500 z-10" : "z-0 hover:ring-1 hover:ring-blue-300"
                    )}
                    style={{
                        left: `${layer.x * 100}%`,
                        top: `${layer.y * 100}%`,
                        width: `${layer.width * 100}%`,
                        height: isText ? 'auto' : `${layer.height * 100}%`,
                        transform: `rotate(${layer.rotation}deg)`,
                        opacity: layer.opacity,
                    }}
                >
                    {layer.type === 'image' ? (
                        <img src={layer.content} alt="layer" className="w-full h-full object-cover pointer-events-none select-none" />
                    ) : (
                        <div 
                            className="whitespace-pre-wrap select-none"
                            style={{
                                color: layer.style?.color,
                                fontSize: `${(visualH * 0.05) * (layer.style?.fontSize || 1)}px`,
                                fontFamily: layer.style?.fontFamily,
                                fontWeight: layer.style?.fontWeight
                            }}
                        >
                            {layer.content}
                        </div>
                    )}
                    
                    {/* Handles (Active only when selected) */}
                    {isSelected && (
                         <>
                            {/* Corner Handles - visible for images always, text maybe? */}
                            {/* Top Left */}
                            <div 
                                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-50 z-20" 
                                onMouseDown={(e) => handleMouseDown(e, layer.id, 'nw')}
                            />
                            {/* Top Right */}
                            <div 
                                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-50 z-20" 
                                onMouseDown={(e) => handleMouseDown(e, layer.id, 'ne')}
                            />
                            {/* Bottom Left */}
                            <div 
                                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-50 z-20" 
                                onMouseDown={(e) => handleMouseDown(e, layer.id, 'sw')}
                            />
                            {/* Bottom Right */}
                            <div 
                                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize hover:bg-blue-50 z-20" 
                                onMouseDown={(e) => handleMouseDown(e, layer.id, 'se')}
                            />
                         </>
                    )}
                </div>
            );
        })}

        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Draw Columns */}
            {Array.from({ length: cols + 1 }).map((_, i) => (
                <div 
                    key={`col-${i}`}
                    className="absolute top-0 bottom-0 border-r border-blue-400 opacity-30"
                    style={{ left: `${(i * printW * displayScale)}px` }}
                >
                    {i < cols && config.showCutLines && (
                        <span className="absolute top-2 left-2 text-[10px] text-blue-600 font-mono bg-blue-50/80 px-1 rounded shadow-sm">
                             P{i+1}
                        </span>
                    )}
                </div>
            ))}
            {/* Draw Rows */}
            {Array.from({ length: rows + 1 }).map((_, i) => (
                <div 
                    key={`row-${i}`}
                    className="absolute left-0 right-0 border-b border-blue-400 opacity-30"
                    style={{ top: `${(i * printH * displayScale)}px` }}
                >
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};