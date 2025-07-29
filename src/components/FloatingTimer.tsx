import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Timer as TimerIcon, Play, Pause, Square, Minimize2, Maximize2, Move } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';

interface FloatingTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
  isOpen, 
  onClose
}) => {
  const {
    minutes,
    seconds,
    isRunning,
    isPaused,
    initialMinutes,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (!isRunning) {
      onClose();
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (isMinimized ? 320 : 448); // Account for dialog width
    const maxY = window.innerHeight - 400; // Account for dialog height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragStart, isMinimized]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return (totalSeconds - remainingSeconds) / totalSeconds * 100;
  };

  const getTimerStatus = () => {
    if (!isRunning) return 'Parado';
    if (isPaused) return 'Pausado';
    return 'Em execução';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={false}>
      <DialogContent 
        ref={dialogRef}
        className={`${isMinimized ? 'max-w-xs' : 'max-w-md'} transition-all duration-300 fixed z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          transform: 'none'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader 
          className="flex flex-row items-center justify-between space-y-0 drag-handle cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <DialogTitle className="flex items-center gap-2 pointer-events-none">
            <TimerIcon className="h-5 w-5" />
            Timer de Estudo
            <Move className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Display */}
          <div className={`text-center ${isMinimized ? 'space-y-2' : 'space-y-4'}`}>
            <div className={`font-bold ${isMinimized ? 'text-3xl' : 'text-5xl'}`}>
              {formatTime(minutes, seconds)}
            </div>

            {!isMinimized && (
              <>
                {/* Progress Bar */}
                {isRunning && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                )}

                {/* Status */}
                <p className="text-sm text-muted-foreground">
                  Status: {getTimerStatus()}
                </p>
              </>
            )}
          </div>

          {/* Control Buttons */}
          <div className={`flex justify-center gap-2 ${isMinimized ? 'flex-wrap' : ''}`}>
            {isRunning && (
              <>
                {!isPaused ? (
                  <Button variant="outline" onClick={pauseTimer} size={isMinimized ? "sm" : "default"}>
                    <Pause className="h-4 w-4 mr-1" />
                    {!isMinimized && "Pausar"}
                  </Button>
                ) : (
                  <Button onClick={resumeTimer} size={isMinimized ? "sm" : "default"}>
                    <Play className="h-4 w-4 mr-1" />
                    {!isMinimized && "Continuar"}
                  </Button>
                )}
                <Button variant="outline" onClick={stopTimer} size={isMinimized ? "sm" : "default"}>
                  <Square className="h-4 w-4 mr-1" />
                  {!isMinimized && "Parar"}
                </Button>
              </>
            )}
          </div>

          {/* Session Info (only when not minimized) */}
          {!isMinimized && (
            <div className="text-center text-xs text-muted-foreground">
              <p>Sessão de {initialMinutes} minutos</p>
              {isRunning && (
                <p className="mt-1">
                  Você pode minimizar esta janela e continuar estudando
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FloatingTimer;