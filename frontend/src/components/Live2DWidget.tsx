import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import styles from './Live2DWidget.module.css';

// Configure Live2D runtime on module load
if (typeof window !== 'undefined') {
  // Set up Cubism runtime if available
  const setupCubismRuntime = () => {
    if ((window as any).Live2DCubismCore) {
      // Cubism 3.0/4.0 is available
      console.log('Live2D: Cubism 3.0/4.0 runtime detected');
    }
    if ((window as any).Live2D) {
      // Cubism 2.1 is available (for pixi-live2d-display initialization check)
      console.log('Live2D: Cubism 2.1 runtime detected');
    }
  };

  // Try immediately
  setupCubismRuntime();

  // Also try after a short delay in case scripts are still loading
  setTimeout(setupCubismRuntime, 100);
}

interface Live2DWidgetProps {
  onChatClick?: () => void;
}

export default function Live2DWidget({ onChatClick }: Live2DWidgetProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize default position (bottom right)
  useEffect(() => {
    const defaultX = window.innerWidth - 200;
    const defaultY = window.innerHeight - 200;

    // Load saved position from localStorage
    const savedPosition = localStorage.getItem('live2d-widget-position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition({ x: parsed.x || defaultX, y: parsed.y || defaultY });
      } catch {
        setPosition({ x: defaultX, y: defaultY });
      }
    } else {
      setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  // Initialize PIXI Application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Wait for Cubism runtime to be available
    const waitForCubism = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check for Cubism runtime (2.1 or 3.0/4.0)
        const checkCubism = () => {
          return typeof window !== 'undefined' &&
            ((window as any).Live2DCubismCore || (window as any).CubismCore || (window as any).Live2D);
        };

        if (checkCubism()) {
          resolve();
          return;
        }

        // Wait for script to load (max 5 seconds)
        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
          attempts++;
          if (checkCubism()) {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Cubism runtime not loaded, Live2D widget will not be displayed');
            reject(new Error('Cubism runtime not loaded'));
          }
        }, 100);
      });
    };

    // Create PIXI Application
    let app: PIXI.Application | null = null;
    try {
      app = new PIXI.Application({
        width: 200,
        height: 200,
        transparent: true,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!app || !canvasRef.current) return;

      canvasRef.current.appendChild(app.view as HTMLCanvasElement);
      appRef.current = app;
    } catch (error) {
      console.error('Failed to create PIXI Application:', error);
      return;
    }

    // Load Live2D model
    const loadModel = async () => {
      // Wait for PIXI app to be ready
      if (!app || !appRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!app || !appRef.current) {
          console.warn('PIXI Application not ready');
          return;
        }
      }

      try {
        console.log('Live2D: Waiting for Cubism runtime...');
        // Wait for Cubism runtime
        await waitForCubism();
        console.log('Live2D: Cubism runtime loaded');

        // Register ticker if not already registered
        try {
          Live2DModel.registerTicker(PIXI.Ticker);
          console.log('Live2D: Ticker registered');
        } catch (error) {
          console.debug('Ticker already registered or error:', error);
        }

        // Configure Cubism runtime if available
        if (typeof window !== 'undefined' && (window as any).Live2DCubismCore) {
          try {
            // Try to configure for Cubism 3.0/4.0
            const CubismCore = (window as any).Live2DCubismCore;
            console.log('Live2D: Cubism 3.0/4.0 runtime available');
          } catch (error) {
            console.debug('Cubism 3.0/4.0 configuration error:', error);
          }
        }

        // Load model
        console.log('Live2D: Loading model from /umiushi/うみうしモデル.model3.json');
        const model = await Live2DModel.from('/umiushi/うみうしモデル.model3.json', {
          autoInteract: true,
        });
        console.log('Live2D: Model loaded successfully', model);

        // Scale model to fit container
        const scale = Math.min(200 / model.width, 200 / model.height) * 0.8;
        model.scale.set(scale);

        // Center model in container
        model.x = (200 - model.width) / 2;
        model.y = (200 - model.height) / 2;

        // Check if app is still valid/mounted before adding child
        if (!app || app !== appRef.current || !app.stage) {
          console.log('Live2D: App destroyed or invalid, skipping model add');
          model.destroy();
          return;
        }

        app.stage.addChild(model);
        modelRef.current = model;
        setIsLoaded(true);
        console.log('Live2D: Model added to stage, widget should be visible now');

        // Enable interactions for click
        model.interactive = true;
        model.cursor = 'pointer';

        // Set event mode to allow both click and drag
        // Pixi v6 uses interactive, v7 uses eventMode. We are on v6.
        // model.eventMode = 'passive'; // Removed as it caused TS error and is for v7

        // Auto play idle motion
        const playIdleMotion = async () => {
          if (model && model.internalModel) {
            try {
              // Try to play the motion file
              // Motion method signature may vary by version
              // Try different approaches
              if (typeof model.motion === 'function') {
                try {
                  await (model.motion as any)('umiushiawa', 0);
                } catch {
                  // Try with motion group
                  await (model.motion as any)('', 0);
                }
              }
            } catch (error) {
              console.debug('Motion playback not available:', error);
            }
          }
        };

        // Play idle motion after a delay
        setTimeout(playIdleMotion, 1000);

        // Set up click handler
        model.on('pointertap', async () => {
          if (onChatClick) {
            onChatClick();
          }
          // Play tap motion if available
          try {
            if (typeof model.motion === 'function') {
              await (model.motion as any)('tap', 0);
            }
          } catch (error) {
            // Motion may not exist, that's okay
            console.debug('Tap motion not available');
          }
        });

        // Mouse follow (eye tracking)
        const handleMouseMove = (event: MouseEvent) => {
          if (!model || !model.internalModel) return;

          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const mouseX = event.clientX - rect.left - 100; // Relative to model center
          const mouseY = event.clientY - rect.top - 100;

          // Update eye direction (simplified)
          const angleX = Math.atan2(mouseX, 200) * 0.3;
          const angleY = Math.atan2(mouseY, 200) * 0.3;

          try {
            const coreModel = (model.internalModel as any).coreModel;
            // Update eye parameters (these IDs may vary by model)
            // Try common parameter names
            const paramNames = ['ParamAngleX', 'ParamAngleY', 'PARAM_ANGLE_X', 'PARAM_ANGLE_Y'];
            paramNames.forEach((name, index) => {
              try {
                const paramIndex = coreModel.getParameterIndexByName(name);
                if (paramIndex >= 0) {
                  const value = index % 2 === 0 ? angleX : angleY;
                  coreModel.setParameterValueByIndex(paramIndex, value);
                }
              } catch {
                // Parameter doesn't exist, skip
              }
            });
          } catch (error) {
            // Model may not have these parameters
            console.debug('Eye tracking parameters not available');
          }
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
        };
      } catch (error) {
        console.error('Failed to load Live2D model:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoaded(false);
      }
    };

    loadModel();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [onChatClick]);

  // Track if this is a click or drag
  const dragStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Handle drag start - works on both container and canvas
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    // Store initial position to distinguish click from drag
    dragStartPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };

    // Calculate offset from the top-left corner of the widget
    // We want: newPosition = currentMouse - offset
    // So: offset = currentMouse - currentPosition
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    // Don't set dragging immediately - wait to see if user moves mouse
  }, [position]);

  // Handle mousedown on canvas directly to enable dragging
  useEffect(() => {
    if (!canvasRef.current || !isLoaded) return;

    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      // Store initial position
      dragStartPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };

      // Calculate offset from the top-left corner of the widget
      dragOffsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    };

    canvas.addEventListener('mousedown', handleCanvasMouseDown, true); // Use capture phase

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown, true);
    };
  }, [isLoaded, position]);

  // Handle drag move and mouse up - always listen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPosRef.current) return;

      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPosRef.current.x, 2) +
        Math.pow(e.clientY - dragStartPosRef.current.y, 2)
      );

      // Start dragging if moved more than 5px
      if (moveDistance > 5) {
        if (!isDragging) {
          setIsDragging(true);
        }

        // Update position
        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;

        // Constrain to viewport
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: constrainedX, y: constrainedY });
      }
    };

    const handleMouseUp = () => {
      if (dragStartPosRef.current) {
        // Save position to localStorage if dragged
        if (isDragging) {
          localStorage.setItem('live2d-widget-position', JSON.stringify(position));
        }
        dragStartPosRef.current = null;
      }
      setIsDragging(false);
    };

    // Always listen for mouse events
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current) return;

    const touch = e.touches[0];
    dragOffsetRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
    setIsDragging(true);
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffsetRef.current.x;
      const newY = touch.clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 200;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      localStorage.setItem('live2d-widget-position', JSON.stringify(position));
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position]);

  // Always render container, even if model is not loaded yet
  return (
    <div
      ref={canvasRef}
      className={`${styles.live2dWidget} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isLoaded ? 1 : 0.5,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {!isLoaded && !loadError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '12px'
        }}>
          Loading...
        </div>
      )}
      {loadError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4d4f',
          fontSize: '11px',
          textAlign: 'center',
          padding: '8px'
        }}>
          Live2D Error
        </div>
      )}
    </div>
  );
}
