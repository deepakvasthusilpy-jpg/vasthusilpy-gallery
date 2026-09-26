'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProjectFile, ProjectFolder } from '@/lib/types';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  Crop, 
  Sparkles, 
  Sliders, 
  Check, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Maximize2, 
  Stamp, 
  Layers, 
  Sun, 
  Contrast, 
  Palette,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Eye
} from 'lucide-react';

export interface PhotoDocEditorModalProps {
  isOpen: boolean;
  file?: ProjectFile | null;
  folder?: ProjectFolder | null;
  initialImageUrl?: string;
  initialFileName?: string;
  isCoverEditor?: boolean;
  onClose: () => void;
  onSaveFile?: (fileId: string, updatedUrl: string, updatedName?: string) => Promise<void>;
  onSaveAsNewFile?: (newFileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
  onSetAsCover?: (folderId: string, coverUrl: string) => Promise<void>;
}

type AspectRatioPreset = 'free' | '16:9' | '4:3' | '1:1' | '3:2' | '9:16';
type FilterPreset = 'normal' | 'doc_scanner' | 'blueprint_cyan' | 'grayscale' | 'sepia' | 'vivid' | 'high_contrast';

export const PhotoDocEditorModal: React.FC<PhotoDocEditorModalProps> = ({
  isOpen,
  file,
  folder,
  initialImageUrl,
  initialFileName,
  isCoverEditor = false,
  onClose,
  onSaveFile,
  onSaveAsNewFile,
  onSetAsCover
}) => {
  // Source image
  const rawImageUrl = initialImageUrl || file?.fileUrl || folder?.coverImageUrl || '';
  const currentFileName = initialFileName || file?.name || (isCoverEditor ? `${folder?.folderName || 'Project'}_Cover.jpg` : 'attachment.jpg');

  // Transformation States
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270, or custom
  const [fineRotation, setFineRotation] = useState<number>(0); // -45 to +45
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  // Adjustment States
  const [brightness, setBrightness] = useState<number>(100); // 0 - 200 (100 is normal)
  const [contrast, setContrast] = useState<number>(100); // 0 - 200
  const [saturation, setSaturation] = useState<number>(100); // 0 - 200
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('normal');

  // Watermark States
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('VASTHUSILPY • APPROVED');
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'center-diagonal' | 'bottom-left'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.6);

  // Crop States
  const [isCropping, setIsCropping] = useState<boolean>(isCoverEditor);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>(isCoverEditor ? '16:9' : 'free');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 5,
    y: 5,
    width: 90,
    height: 90
  }); // percentage based (0 - 100)

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<'crop_rotate' | 'adjust_filter' | 'watermark' | 'cover'>('crop_rotate');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Canvas References
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  // Image loader effect
  useEffect(() => {
    if (!isOpen || !rawImageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      setImageLoaded(true);
      setRotation(0);
      setFineRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setActiveFilter('normal');
      setEnableWatermark(false);
      setIsCropping(isCoverEditor);
      setAspectRatio(isCoverEditor ? '16:9' : 'free');
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
      setActiveTab(isCoverEditor ? 'crop_rotate' : 'crop_rotate');
      setSaveSuccessNotice(null);
    };
    img.src = rawImageUrl;
  }, [isOpen, rawImageUrl, isCoverEditor]);

  // Redraw Canvas with current edits
  const renderCanvas = useCallback(() => {
    if (!imgRef.current || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const totalRotation = (rotation + fineRotation) * (Math.PI / 180);
    const isRotatedQuarter = Math.abs(Math.sin(totalRotation)) > 0.7;

    // Source dimensions
    const origW = img.naturalWidth || 800;
    const origH = img.naturalHeight || 600;

    // Crop coordinates in original image space
    let cropX = (cropBox.x / 100) * origW;
    let cropY = (cropBox.y / 100) * origH;
    let cropW = (cropBox.width / 100) * origW;
    let cropH = (cropBox.height / 100) * origH;

    // Clamp coordinates
    cropX = Math.max(0, Math.min(origW - 10, cropX));
    cropY = Math.max(0, Math.min(origH - 10, cropY));
    cropW = Math.max(10, Math.min(origW - cropX, cropW));
    cropH = Math.max(10, Math.min(origH - cropY, cropH));

    // Target canvas dimensions
    const destW = isRotatedQuarter ? cropH : cropW;
    const destH = isRotatedQuarter ? cropW : cropH;

    canvas.width = Math.round(destW);
    canvas.height = Math.round(destH);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center transform
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(totalRotation);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Apply Filter / Color Adjustments
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    if (activeFilter === 'doc_scanner') {
      // High contrast B&W document scanner mode
      filterString = `grayscale(100%) contrast(220%) brightness(120%)`;
    } else if (activeFilter === 'blueprint_cyan') {
      // Blueprint cyan tint
      filterString = `invert(90%) hue-rotate(180deg) saturate(160%) contrast(150%)`;
    } else if (activeFilter === 'grayscale') {
      filterString += ` grayscale(100%)`;
    } else if (activeFilter === 'sepia') {
      filterString += ` sepia(85%) contrast(110%)`;
    } else if (activeFilter === 'vivid') {
      filterString += ` saturate(160%) contrast(120%)`;
    } else if (activeFilter === 'high_contrast') {
      filterString += ` contrast(160%) brightness(95%)`;
    }

    ctx.filter = filterString;

    // Draw the cropped sub-rectangle of source image centered
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropW,
      cropH,
      -cropW / 2,
      -cropH / 2,
      cropW,
      cropH
    );

    ctx.restore();

    // Render Watermark if enabled
    if (enableWatermark && watermarkText.trim()) {
      ctx.save();
      const fontSize = Math.max(16, Math.round(canvas.width * 0.035));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      if (watermarkPos === 'center-diagonal') {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(watermarkText.toUpperCase(), 0, 0);
      } else if (watermarkPos === 'bottom-right') {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(watermarkText, canvas.width - 24, canvas.height - 20);
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(watermarkText, 24, canvas.height - 20);
      }
      ctx.restore();
    }
  }, [
    rotation,
    fineRotation,
    flipH,
    flipV,
    cropBox,
    brightness,
    contrast,
    saturation,
    activeFilter,
    enableWatermark,
    watermarkText,
    watermarkPos,
    watermarkOpacity
  ]);

  useEffect(() => {
    if (imageLoaded) {
      renderCanvas();
    }
  }, [imageLoaded, renderCanvas]);

  if (!isOpen) return null;

  // Aspect ratio crop adjusters
  const applyAspectRatio = (ratio: AspectRatioPreset) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === '16:9') targetRatio = 16 / 9;
    if (ratio === '4:3') targetRatio = 4 / 3;
    if (ratio === '1:1') targetRatio = 1;
    if (ratio === '3:2') targetRatio = 3 / 2;
    if (ratio === '9:16') targetRatio = 9 / 16;

    const imgW = imageDimensions.width;
    const imgH = imageDimensions.height;
    const currentImgRatio = imgW / imgH;

    let newWidthPct = 90;
    let newHeightPct = 90;

    if (targetRatio > currentImgRatio) {
      newWidthPct = 90;
      newHeightPct = Math.min(90, (newWidthPct * currentImgRatio) / targetRatio);
    } else {
      newHeightPct = 90;
      newWidthPct = Math.min(90, (newHeightPct * targetRatio) / currentImgRatio);
    }

    setCropBox({
      x: (100 - newWidthPct) / 2,
      y: (100 - newHeightPct) / 2,
      width: newWidthPct,
      height: newHeightPct
    });
  };

  // Quick Rotations
  const handleRotate90Clockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotate90CounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleResetAll = () => {
    setRotation(0);
    setFineRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter('normal');
    setEnableWatermark(false);
    setAspectRatio(isCoverEditor ? '16:9' : 'free');
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
  };

  // Export Canvas to Data URL
  const getProcessedDataUrl = (): string => {
    if (!previewCanvasRef.current) return rawImageUrl;
    return previewCanvasRef.current.toDataURL('image/jpeg', 0.92);
  };

  // Handle Overwrite / Save current File
  const handleSaveOverwrite = async () => {
    setIsProcessing(true);
    const dataUrl = getProcessedDataUrl();

    if (file && onSaveFile) {
      await onSaveFile(file.id, dataUrl, file.name);
      setSaveSuccessNotice('File attachment updated and saved!');
    } else if (folder && onSetAsCover) {
      await onSetAsCover(folder.id, dataUrl);
      setSaveSuccessNotice('Folder cover photo updated successfully!');
    }

    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  // Handle Save As New File Version
  const handleSaveAsNew = async () => {
    if (!onSaveAsNewFile) return;
    setIsProcessing(true);
    const dataUrl = getProcessedDataUrl();
    const baseName = currentFileName.replace(/\.[^/.]+$/, '');
    const ext = currentFileName.includes('.') ? currentFileName.split('.').pop() : 'jpg';
    const newName = `${baseName}_edited_${Date.now().toString().slice(-4)}.${ext}`;

    await onSaveAsNewFile({
      name: newName,
      type: file?.type || 'photo',
      fileUrl: dataUrl,
      fileSize: '1.8 MB (Optimized)',
      uploadedBy: 'Architect Editor',
      category: file?.category || 'Edited Design',
      description: `Edited, rotated & cropped version of ${currentFileName}`
    });

    setSaveSuccessNotice('Saved as a new version in project vault!');
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  // Set directly as Folder Cover
  const handleDirectSetCover = async () => {
    if (!folder || !onSetAsCover) return;
    setIsProcessing(true);
    const dataUrl = getProcessedDataUrl();
    await onSetAsCover(folder.id, dataUrl);
    setSaveSuccessNotice(`Cover image set for ${folder.folderName}!`);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  // Download locally
  const handleDownloadEdited = () => {
    const dataUrl = getProcessedDataUrl();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `vasthusilpy_${currentFileName.replace(/\s+/g, '_')}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in">
      <div className="relative w-full max-w-6xl h-[94vh] bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
              {isCoverEditor ? <ImageIcon className="w-5 h-5" /> : <Crop className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600 text-white">
                  {isCoverEditor ? 'Cover Photo Studio' : 'Photo & Document Editor'}
                </span>
                {folder && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    • Vault: <strong className="text-slate-200">{folder.folderName}</strong>
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {currentFileName}
              </h3>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Reset all edits"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              onClick={handleDownloadEdited}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Download edited high-res file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Interactive Canvas Viewport (Left) + Editing Controls Panel (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: Live Interactive Canvas Stage */}
          <div 
            ref={containerRef}
            className="flex-1 bg-slate-950/80 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden select-none"
          >
            {/* Blueprint Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Canvas Preview */}
            <div className="relative max-w-full max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 bg-black/60">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[58vh] lg:max-h-[70vh] object-contain transition-all"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              />

              {/* Status Badge */}
              {saveSuccessNotice && (
                <div className="absolute top-4 inset-x-4 mx-auto max-w-md bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 animate-in slide-in-from-top">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}
            </div>

            {/* Zoom / View toolbar */}
            <div className="absolute bottom-4 left-6 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl text-xs text-slate-300">
              <button 
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} 
                className="p-1 hover:text-white" 
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} 
                className="p-1 hover:text-white" 
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-3 w-px bg-slate-700 mx-1" />
              <button 
                onClick={() => setZoom(1)} 
                className="hover:text-white font-medium text-[11px]"
              >
                Fit
              </button>
            </div>

            {/* Dimension & Rotation indicator */}
            <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl text-[11px] text-slate-400 font-mono">
              <span>Rotation: {rotation + fineRotation}°</span>
              <span>•</span>
              <span>Aspect: {aspectRatio}</span>
            </div>
          </div>

          {/* RIGHT: Tools & Adjustment Controls */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 overflow-hidden">
            
            {/* Tool Tabs */}
            <div className="grid grid-cols-3 p-2 bg-slate-950 border-b border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('crop_rotate')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'crop_rotate' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate & Crop</span>
              </button>

              <button
                onClick={() => setActiveTab('adjust_filter')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'adjust_filter' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust & Scan</span>
              </button>

              <button
                onClick={() => setActiveTab('watermark')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'watermark' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Watermark</span>
              </button>
            </div>

            {/* Tab Controls Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB 1: ROTATE & CROP */}
              {activeTab === 'crop_rotate' && (
                <div className="space-y-6">
                  
                  {/* Quick 90° Rotations & Flips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-red-500" />
                      <span>Orientation & Flip</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={handleRotate90CounterClockwise}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition"
                        title="Rotate 90° Left"
                      >
                        <RotateCcw className="w-4 h-4 text-red-400" />
                        <span>-90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRotate90Clockwise}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition"
                        title="Rotate 90° Right"
                      >
                        <RotateCw className="w-4 h-4 text-red-400" />
                        <span>+90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFlipH(!flipH)}
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                          flipH ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title="Flip Horizontal"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        <span>Flip H</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFlipV(!flipV)}
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                          flipV ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title="Flip Vertical"
                      >
                        <FlipVertical className="w-4 h-4" />
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>

                  {/* Fine Angle Alignment Slider */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Fine Angle Leveling:</span>
                      <span className="font-mono text-red-400 font-bold">{fineRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={fineRotation}
                      onChange={(e) => setFineRotation(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>-45°</span>
                      <button onClick={() => setFineRotation(0)} className="hover:text-white underline">0° Level</button>
                      <span>+45°</span>
                    </div>
                  </div>

                  {/* Crop Aspect Ratio Presets */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crop className="w-3.5 h-3.5 text-red-500" />
                        <span>Crop Aspect Ratio</span>
                      </div>
                      <span className="text-[10px] text-red-400 lowercase font-mono">{aspectRatio}</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => applyAspectRatio('free')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition ${
                          aspectRatio === 'free' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        Free / Full
                      </button>

                      <button
                        type="button"
                        onClick={() => applyAspectRatio('16:9')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center ${
                          aspectRatio === '16:9' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>16:9</span>
                        <span className="text-[9px] opacity-75">Cover Banner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyAspectRatio('4:3')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center ${
                          aspectRatio === '4:3' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>4:3</span>
                        <span className="text-[9px] opacity-75">CAD / Blueprint</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyAspectRatio('1:1')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center ${
                          aspectRatio === '1:1' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>1:1</span>
                        <span className="text-[9px] opacity-75">Square / Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyAspectRatio('3:2')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center ${
                          aspectRatio === '3:2' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>3:2</span>
                        <span className="text-[9px] opacity-75">Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyAspectRatio('9:16')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center ${
                          aspectRatio === '9:16' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>9:16</span>
                        <span className="text-[9px] opacity-75">Vertical Plan</span>
                      </button>
                    </div>

                    {/* Crop Margins Slider */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Crop Focus Zoom / Inset:</span>
                        <span className="font-mono text-white">{100 - cropBox.width}% Inset</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        value={cropBox.width}
                        onChange={(e) => {
                          const w = parseInt(e.target.value);
                          const h = aspectRatio === '16:9' ? Math.round(w * (9 / 16)) : w;
                          setCropBox({
                            x: (100 - w) / 2,
                            y: (100 - h) / 2,
                            width: w,
                            height: Math.min(100, h)
                          });
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ADJUST & DOCUMENT SCANNER FILTERS */}
              {activeTab === 'adjust_filter' && (
                <div className="space-y-6">
                  
                  {/* Preset Architectural / Document Filters */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
                      <span>Blueprint & Document Scanner Presets</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('doc_scanner');
                          setBrightness(115);
                          setContrast(180);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          activeFilter === 'doc_scanner'
                            ? 'bg-red-950/60 border-red-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">📄 Document Scan</span>
                          {activeFilter === 'doc_scanner' && <Check className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">High-contrast B&W for CAD lines & deeds</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('blueprint_cyan');
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          activeFilter === 'blueprint_cyan'
                            ? 'bg-cyan-950/60 border-cyan-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">📐 Blueprint Cyan</span>
                          {activeFilter === 'blueprint_cyan' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">Classic architectural cyanotype</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter('normal');
                          setBrightness(100);
                          setContrast(100);
                          setSaturation(100);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          activeFilter === 'normal'
                            ? 'bg-red-950/60 border-red-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">🎨 Original Color</span>
                          {activeFilter === 'normal' && <Check className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">Standard true rendering</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveFilter('vivid')}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          activeFilter === 'vivid'
                            ? 'bg-red-950/60 border-red-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">🌟 3D Render Vivid</span>
                          {activeFilter === 'vivid' && <Check className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">Enhanced lighting & materials</span>
                      </button>
                    </div>
                  </div>

                  {/* Fine Adjustment Sliders */}
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    
                    {/* Brightness */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          Brightness:
                        </span>
                        <span className="font-mono text-slate-400">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Contrast className="w-3.5 h-3.5 text-blue-400" />
                          Contrast (Blueprint Sharpness):
                        </span>
                        <span className="font-mono text-slate-400">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="220"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Palette className="w-3.5 h-3.5 text-emerald-400" />
                          Saturation:
                        </span>
                        <span className="font-mono text-slate-400">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 3: WATERMARK & APPROVAL STAMP */}
              {activeTab === 'watermark' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5 text-red-500" />
                      <span>Architectural Watermark</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  {enableWatermark ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Stamp Text:</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. VASTHUSILPY APPROVED"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'VASTHUSILPY • APPROVED',
                          'CONFIDENTIAL CLIENT COPY',
                          'DRAFT FOR SANCTION ONLY',
                          'VASTHU VERIFIED'
                        ].map((txt) => (
                          <button
                            key={txt}
                            type="button"
                            onClick={() => setWatermarkText(txt)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                          >
                            {txt}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Position:</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['bottom-right', 'center-diagonal', 'bottom-left'] as const).map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setWatermarkPos(pos)}
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold capitalize transition ${
                                watermarkPos === pos ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {pos.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Opacity:</span>
                          <span className="font-mono text-white">{Math.round(watermarkOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 text-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">
                        Check the box above to protect your architectural designs with an official Vasthusilpy digital watermark.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Save & Export Actions Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2 shrink-0">
              
              {/* Primary: Overwrite / Save Edits */}
              <button
                type="button"
                onClick={handleSaveOverwrite}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {isProcessing ? 'Saving Edits...' : (isCoverEditor ? 'Save as Folder Cover Photo' : 'Save & Overwrite Attachment')}
                </span>
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                {folder && onSetAsCover && !isCoverEditor && (
                  <button
                    type="button"
                    onClick={handleDirectSetCover}
                    disabled={isProcessing}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    title="Set this edited crop as folder cover"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Set as Cover</span>
                  </button>
                )}

                {onSaveAsNewFile && !isCoverEditor && (
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    disabled={isProcessing}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition col-span-1"
                    title="Keep original and save as a new version"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Save as New</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
