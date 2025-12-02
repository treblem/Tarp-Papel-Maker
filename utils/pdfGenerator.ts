import jsPDF from 'jspdf';
import { Layer, PosterConfig, PaperSize, PaperOrientation, Unit } from '../types';
import { PAPER_SIZES } from '../constants';

export const generateTiledPDF = async (
  config: PosterConfig,
  layers: Layer[],
  paperSize: PaperSize
) => {
  const isInch = config.unit === Unit.INCH;
  
  // Convert paper size to current unit
  // Constants are in mm, so we convert to inches if needed
  const paperWidth = isInch ? paperSize.width / 25.4 : paperSize.width;
  const paperHeight = isInch ? paperSize.height / 25.4 : paperSize.height;

  // 1. Determine Total Dimensions
  let posterWidth = config.targetWidth;
  let posterHeight = config.targetHeight;

  // Determine paper dimensions based on orientation
  const isPortrait = config.orientation === PaperOrientation.PORTRAIT;
  const pWidth = isPortrait ? paperWidth : paperHeight;
  const pHeight = isPortrait ? paperHeight : paperWidth;

  // Printable area
  const printW = pWidth - (config.margin * 2);
  const printH = pHeight - (config.margin * 2);

  if (printW <= 0 || printH <= 0) {
    throw new Error("Margins are too large for the selected paper size.");
  }

  // If in Grid Mode, calculate the target size based on the grid
  // In Grid Mode, we want the poster to FILL the grid.
  if (config.mode === 'grid') {
    posterWidth = config.gridCols * printW; 
    posterHeight = config.gridRows * printH;
  } 

  const cols = Math.ceil(posterWidth / printW);
  const rows = Math.ceil(posterHeight / printH);

  // 2. Create High-Res Virtual Canvas
  // Scale factor needs to be higher for inches to maintain resolution
  // If mm: 1mm ~ 3.78px. Scale 5 => ~19px/mm (~480 dpi equiv relative to base) - High Quality
  // If in: 1in = 25.4mm. We want comparable resolution. 
  // Scale 5 * 25.4 ~= 127. Let's use 120 for inches (approx 300 DPI effectively)
  const scale = isInch ? 120 : 5; 
  
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(posterWidth * scale);
  canvas.height = Math.ceil(posterHeight * scale);
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not create canvas context");

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Layers
  for (const layer of layers) {
    ctx.save();
    const lx = layer.x * canvas.width;
    const ly = layer.y * canvas.height;
    const lw = layer.width * canvas.width;
    const lh = layer.height * canvas.height;

    // Translate to center of layer for rotation
    const cx = lx + lw / 2;
    const cy = ly + lh / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = layer.opacity;

    if (layer.type === 'image') {
      const img = new Image();
      img.src = layer.content;
      await new Promise((resolve) => {
        if (img.complete) resolve(true);
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });
      ctx.drawImage(img, lx, ly, lw, lh);
    } else if (layer.type === 'text') {
        // Font size relative to height. 
        const fontSize = (canvas.height * 0.05) * (layer.style?.fontSize || 1);
        ctx.font = `${layer.style?.fontWeight || 'normal'} ${fontSize}px ${layer.style?.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = layer.style?.color || '#000000';
        ctx.textBaseline = 'top';
        // Handle multiline text
        const lines = layer.content.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, lx, ly + (i * fontSize * 1.2));
        });
    }
    ctx.restore();
  }

  // 3. Generate PDF Pages
  const doc = new jsPDF({
    orientation: isPortrait ? 'p' : 'l',
    unit: config.unit,
    format: [pWidth, pHeight]
  });

  // Remove the initial page added by jsPDF
  doc.deletePage(1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      doc.addPage([pWidth, pHeight], isPortrait ? 'p' : 'l');

      // Calculate where on the source canvas we are looking
      // Source coordinates (in unscaled unit)
      const srcX = c * printW;
      const srcY = r * printH;
      
      // Calculate remaining width/height to avoid drawing whitespace if partial
      const srcW = Math.min(printW, posterWidth - srcX);
      const srcH = Math.min(printH, posterHeight - srcY);

      // Destination on PDF
      const destX = config.margin;
      const destY = config.margin;

      // Extract image data from canvas
      // We clip the canvas data
      const sx = srcX * scale;
      const sy = srcY * scale;
      const sw = srcW * scale;
      const sh = srcH * scale;

      if (sw > 0 && sh > 0) {
        // Create a temporary canvas for this tile to ensure clean edges
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = sw;
        tileCanvas.height = sh;
        const tileCtx = tileCanvas.getContext('2d');
        if (tileCtx) {
            tileCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
            const tileData = tileCanvas.toDataURL('image/jpeg', 0.95);
            doc.addImage(tileData, 'JPEG', destX, destY, srcW, srcH);
        }
      }

      // Add Guides / Cut Lines
      if (config.showCutLines && config.cutLineStyle !== 'none') {
        doc.setLineWidth(isInch ? 0.01 : 0.3); // Adjust line width for unit
        doc.setDrawColor(150, 150, 150);
        
        if (config.cutLineStyle === 'dashed') {
          doc.setLineDashPattern([isInch ? 0.1 : 2, isInch ? 0.1 : 2], 0);
        } else {
          doc.setLineDashPattern([], 0);
        }

        // Draw bounding box around the printable area
        doc.rect(destX, destY, srcW, srcH);

        // Add scissor marks
        const markLen = isInch ? 0.2 : 5;
        const markOffset = isInch ? 0.08 : 2;
        doc.setLineDashPattern([], 0); // Solid for marks
        doc.setDrawColor(0, 0, 0);
        
        // Top Left
        doc.line(destX - markOffset, destY, destX + markLen, destY); // Horiz
        doc.line(destX, destY - markOffset, destX, destY + markLen); // Vert
        
        // Bottom Right
        doc.line(destX + srcW - markLen, destY + srcH, destX + srcW + markOffset, destY + srcH);
        doc.line(destX + srcW, destY + srcH - markLen, destX + srcW, destY + srcH + markOffset);
      }

      // Page Numbers
      if (config.showPageNumbers) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Page ${r + 1}-${c + 1} (Row ${r + 1}, Col ${c + 1})`, 
          isInch ? 0.2 : 5, 
          pHeight - (isInch ? 0.2 : 5)
        );
      }
    }
  }

  doc.save('docuslice-poster.pdf');
};