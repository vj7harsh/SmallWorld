/**
 * MapViewport Component
 *
 * A container that provides pan and zoom functionality for map previews.
 * - Zoom is controlled externally via the `zoom` prop
 * - Panning is done via click-and-drag
 * - Mouse wheel zoom is disabled (prevented)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, WheelEvent } from 'react';

interface MapViewportProps {
  /** The map content to render inside the viewport */
  children: ReactNode;
  /** Current zoom level (controlled externally) */
  zoom: number;
  /** Optional class name for the outer container */
  className?: string;
}

interface PanOffset {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
}

export function MapViewport({ children, zoom, className = '' }: MapViewportProps) {
  /** Current pan offset in pixels */
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });

  /** Drag state for tracking mouse movement */
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  /** Reference to the container element */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Whether the user is currently dragging */
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Prevent wheel events from zooming
   * This prevents both map zoom and page zoom when cursor is over the map
   */
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle mouse down to start dragging
   */
  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    e.preventDefault();

    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };

    setIsDragging(true);
  }, [panOffset]);

  /**
   * Handle mouse move during drag
   */
  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    e.preventDefault();

    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;

    setPanOffset({
      x: dragStateRef.current.startPanX + deltaX,
      y: dragStateRef.current.startPanY + deltaY,
    });
  }, []);

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  /**
   * Set up global mouse event listeners for drag handling
   * Using global listeners ensures drag continues even if mouse leaves the container
   */
  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    // Only add listeners when dragging
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Prevent default wheel behavior at the DOM level
   * This is needed because React's onWheel with preventDefault doesn't work
   * for passive event listeners in some browsers
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventWheel = (e: globalThis.WheelEvent) => {
      // ✅ Block page scroll + browser zoom + any inner map wheel handlers
      e.preventDefault();
      e.stopPropagation();
    };

    // ✅ Capture phase so we intercept before inner elements (svg/canvas) handle it
    el.addEventListener('wheel', preventWheel, { passive: false, capture: true });

    // ✅ Safari trackpad pinch can trigger gesture events
    const preventGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('gesturestart', preventGesture as EventListener, { passive: false } as any);
    el.addEventListener('gesturechange', preventGesture as EventListener, { passive: false } as any);
    el.addEventListener('gestureend', preventGesture as EventListener, { passive: false } as any);

    return () => {
      el.removeEventListener('wheel', preventWheel as EventListener, { capture: true } as any);
      el.removeEventListener('gesturestart', preventGesture as EventListener);
      el.removeEventListener('gesturechange', preventGesture as EventListener);
      el.removeEventListener('gestureend', preventGesture as EventListener);
    };
  }, []);


  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{
        touchAction: 'none', // Prevent browser gestures
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default MapViewport;
