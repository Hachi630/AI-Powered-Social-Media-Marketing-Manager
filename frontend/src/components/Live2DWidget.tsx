import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { useLocation } from 'react-router-dom';
import ELOChatDialog from './ELOChatDialog';
import ELOTipBubble from './ELOTipBubble';
import { useInactivity } from '../hooks/useInactivity';
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
  modelPath: string;
  onSendToDashboard?: (message: string) => void;
  isPreview?: boolean; // If true, render in preview mode (relative positioning, no drag)
}

export default function Live2DWidget({ modelPath, onSendToDashboard, isPreview = false }: Live2DWidgetProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();
  
  // Tip bubble state
  const [tipMessage, setTipMessage] = useState<string>('');
  const [tipType, setTipType] = useState<'info' | 'reminder' | 'tip'>('info');
  const [tipDuration, setTipDuration] = useState<number>(0);
  const [tipVisible, setTipVisible] = useState(false);

  // Crawl animation state
  const [isCrawling, setIsCrawling] = useState(false);
  const crawlAnimationRef = useRef<number | null>(null);
  const originalPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isCrawlingRef = useRef(false); // Ref to track crawling state for event handlers
  const performCrawlAnimationRef = useRef<(() => Promise<void>) | null>(null); // Ref to store latest performCrawlAnimation

  // Listen for tip events from other components
  useEffect(() => {
    const handleTipEvent = (event: CustomEvent) => {
      const { message, type, duration } = event.detail || {};
      if (message) {
        console.log('[ELO] Received tip event:', { message, type, duration });
        setTipMessage(message);
        setTipType(type || 'info');
        setTipDuration(duration || 0);
        setTipVisible(true);
      }
    };

    window.addEventListener('elo-show-tip', handleTipEvent as EventListener);
    return () => {
      window.removeEventListener('elo-show-tip', handleTipEvent as EventListener);
    };
  }, []);

  // Initialize default position (bottom right corner) - skip in preview mode
  useEffect(() => {
    if (isPreview) {
      // In preview mode, use relative positioning
      setPosition({ x: 0, y: 0 });
      return;
    }

    const widgetWidth = 200;
    const widgetHeight = 200;
    const margin = 20; // Margin from edges
    
    // Calculate bottom right position - ensure it's in the bottom right corner
    const calculatePosition = () => {
      const defaultX = window.innerWidth - widgetWidth - margin;
      const defaultY = window.innerHeight - widgetHeight - margin;
      return { x: defaultX, y: defaultY };
    };

    // Load saved position from localStorage
    const savedPosition = localStorage.getItem('live2d-widget-position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        const defaultPos = calculatePosition();
        // If saved position is too far from bottom right, reset to default
        const distanceFromBottomRight = Math.sqrt(
          Math.pow((window.innerWidth - margin - widgetWidth) - (parsed.x || defaultPos.x), 2) +
          Math.pow((window.innerHeight - margin - widgetHeight) - (parsed.y || defaultPos.y), 2)
        );
        // If saved position is more than 100px away from bottom right, use default
        if (distanceFromBottomRight > 100) {
          setPosition(defaultPos);
          localStorage.setItem('live2d-widget-position', JSON.stringify(defaultPos));
        } else {
          // Ensure saved position is valid (within viewport)
          const validX = Math.max(margin, Math.min(parsed.x || defaultPos.x, window.innerWidth - widgetWidth - margin));
          const validY = Math.max(margin, Math.min(parsed.y || defaultPos.y, window.innerHeight - widgetHeight - margin));
          setPosition({ x: validX, y: validY });
        }
      } catch {
        const defaultPos = calculatePosition();
        setPosition(defaultPos);
      }
    } else {
      const defaultPos = calculatePosition();
      setPosition(defaultPos);
    }

    // Update position on window resize
    const handleResize = () => {
      const defaultPos = calculatePosition();
      setPosition(prev => {
        // Keep relative position, but ensure it stays in bottom right area
        const newX = Math.min(prev.x, window.innerWidth - widgetWidth - margin);
        const newY = Math.min(prev.y, window.innerHeight - widgetHeight - margin);
        return { x: newX, y: newY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPreview]);

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
        console.log(`Live2D: Loading model from ${modelPath}`);
        const model = await Live2DModel.from(modelPath, {
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

        // Set up click handler - toggle dialog open/close
        model.on('pointertap', async () => {
          // Stop crawl animation if user clicks (use ref for latest state)
          if (isCrawlingRef.current) {
            stopCrawlAnimation();
            return;
          }

          console.log('[ELO] Model clicked, toggling dialog');
          // Toggle ELO dialog
          setDialogOpen(prev => {
            const newState = !prev;
            console.log('[ELO] Dialog state changed:', newState);
            return newState;
          });
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
  }, [modelPath]);

  // Track if this is a click or drag
  const dragStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Stop crawl animation if user becomes active - MUST be defined BEFORE any useCallback that references it
  const stopCrawlAnimation = useCallback(() => {
    if (crawlAnimationRef.current) {
      cancelAnimationFrame(crawlAnimationRef.current);
      crawlAnimationRef.current = null;
    }
    if (isCrawlingRef.current) {
      setIsCrawling(false);
      isCrawlingRef.current = false;
      originalPositionRef.current = null;
    }
  }, []);

  // Handle drag start - works on both container and canvas (disabled in preview mode)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || isPreview || isCrawling) return;

    // Stop crawl animation if user interacts
    stopCrawlAnimation();

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
  }, [position, isCrawling, stopCrawlAnimation]);

  // Handle mousedown on canvas directly to enable dragging
  useEffect(() => {
    if (!canvasRef.current || !isLoaded) return;

    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (!canvasRef.current || isCrawling) return;

      // Stop crawl animation if user interacts
      stopCrawlAnimation();

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
  }, [isLoaded, position, isCrawling, stopCrawlAnimation]);

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

        // Constrain to viewport (with margin)
        const margin = 20;
        const widgetWidth = 200;
        const widgetHeight = 200;
        const maxX = window.innerWidth - widgetWidth - margin;
        const maxY = window.innerHeight - widgetHeight - margin;
        const constrainedX = Math.max(margin, Math.min(newX, maxX));
        const constrainedY = Math.max(margin, Math.min(newY, maxY));

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
    if (isPreview) return;
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

      // Constrain to viewport (with margin)
      const margin = 20;
      const widgetWidth = 200;
      const widgetHeight = 200;
      const maxX = window.innerWidth - widgetWidth - margin;
      const maxY = window.innerHeight - widgetHeight - margin;
      const constrainedX = Math.max(margin, Math.min(newX, maxX));
      const constrainedY = Math.max(margin, Math.min(newY, maxY));

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

  // Determine current page from location
  const getCurrentPage = (): 'calendar' | 'dashboard' | 'chat' | 'campaign' => {
    const path = location.pathname;
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/socialdashboard')) return 'campaign';
    return 'dashboard';
  };

  // Handle send to dashboard
  const handleSendToDashboard = useCallback((message: string) => {
    if (onSendToDashboard) {
      onSendToDashboard(message);
    }
    // Store message in localStorage for Dashboard to pick up
    localStorage.setItem('elo-pending-message', message);
    // Trigger storage event for same-window listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'elo-pending-message',
      newValue: message,
    }));
    // Send message to dashboard without navigating
    // The message will be handled by the current page's ChatBox if available
    window.dispatchEvent(new CustomEvent('elo-send-message', { detail: { message } }));
  }, [onSendToDashboard]);

  // Play crawl motion
  const playCrawlMotion = useCallback(async () => {
    if (modelRef.current && typeof modelRef.current.motion === 'function') {
      try {
        // Try to play crawl motion (if motion file exists)
        await (modelRef.current.motion as any)('crawl', 0);
        console.log('[ELO] Playing crawl motion');
      } catch (error) {
        // If motion file doesn't exist, try other motions or skip
        try {
          // Try to play idle motion as fallback
          await (modelRef.current.motion as any)('umiushiawa', 0);
        } catch {
          console.debug('Crawl motion not available, using fallback');
        }
      }
    }
  }, []);

  // Perform crawl animation on screen
  const performCrawlAnimation = useCallback(async () => {
    // Use refs to get latest values to avoid stale closures
    if (isCrawlingRef.current || isPreview || !isLoaded || isDragging || dialogOpen) {
      return;
    }

    // Check if model is still loaded
    if (!modelRef.current) {
      return;
    }

    console.log('[ELO] Starting crawl animation');
    setIsCrawling(true);
    isCrawlingRef.current = true;
    
    // Get current position at animation start
    const currentPos = position;
    originalPositionRef.current = { ...currentPos };

    // Play crawl motion
    await playCrawlMotion();

    const widgetWidth = 200;
    const widgetHeight = 200;
    const margin = 20;

    // Calculate target position - move to a random position on screen
    // Prefer moving horizontally (crawling across screen)
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Choose a target position (prefer horizontal movement)
    let targetX: number;
    let targetY: number;
    
    // 70% chance to move horizontally, 30% chance to move diagonally
    if (Math.random() > 0.3) {
      // Horizontal crawl - move to opposite side
      targetX = currentPos.x < screenWidth / 2 
        ? screenWidth - widgetWidth - margin 
        : margin;
      targetY = currentPos.y + (Math.random() - 0.5) * 200; // Slight vertical variation
    } else {
      // Diagonal crawl - move to random position
      targetX = margin + Math.random() * (screenWidth - widgetWidth - 2 * margin);
      targetY = margin + Math.random() * (screenHeight - widgetHeight - 2 * margin);
    }

    // Ensure target is within bounds
    targetX = Math.max(margin, Math.min(targetX, screenWidth - widgetWidth - margin));
    targetY = Math.max(margin, Math.min(targetY, screenHeight - widgetHeight - margin));

    // Calculate distance and duration
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2)
    );
    // Calculate duration based on distance - extremely slow crawl movement for smooth, natural feel
    const pixelsPerSecond = 20; // Much slower crawl speed (reduced from 50 to 20)
    const duration = Math.max(8000, Math.min(25000, (distance / pixelsPerSecond) * 1000)); // 8-25 seconds based on distance
    const startTime = Date.now();
    const startX = currentPos.x;
    const startY = currentPos.y;

    // Animate position using requestAnimationFrame
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Use smoother easing function for more natural crawling feel (ease-in-out with slight variation)
      // This creates a more organic, crawling-like movement
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Add subtle variation to create more natural crawling motion
      const variation = Math.sin(progress * Math.PI * 4) * 0.02; // Small vertical/horizontal variation
      const finalProgress = Math.max(0, Math.min(1, easedProgress + variation));

      // Apply eased progress with subtle variation for natural crawling
      const currentX = startX + (targetX - startX) * finalProgress;
      const currentY = startY + (targetY - startY) * finalProgress;

      setPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        crawlAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        console.log('[ELO] Crawl animation complete');
        
        // Wait a moment, then return to original position or stay
        setTimeout(() => {
          if (originalPositionRef.current && !isDragging) {
            // Return to original position smoothly
            const returnStartTime = Date.now();
            const returnStartX = targetX;
            const returnStartY = targetY;
            // Calculate return duration based on distance
            const returnDistance = Math.sqrt(
              Math.pow(originalPositionRef.current.x - targetX, 2) +
              Math.pow(originalPositionRef.current.y - targetY, 2)
            );
            const pixelsPerSecond = 20; // Much slower return speed (reduced from 50 to 20)
            const returnDuration = Math.max(6000, Math.min(20000, (returnDistance / pixelsPerSecond) * 1000)); // 6-20 seconds to return

            const returnAnimate = () => {
              const returnElapsed = Date.now() - returnStartTime;
              const returnProgress = Math.min(1, returnElapsed / returnDuration);
              const returnEasedProgress = returnProgress < 0.5
                ? 2 * returnProgress * returnProgress
                : 1 - Math.pow(-2 * returnProgress + 2, 2) / 2;
              
              // Add subtle variation for natural crawling motion
              const returnVariation = Math.sin(returnProgress * Math.PI * 4) * 0.02;
              const returnFinalProgress = Math.max(0, Math.min(1, returnEasedProgress + returnVariation));

              const returnX = returnStartX + (originalPositionRef.current!.x - returnStartX) * returnFinalProgress;
              const returnY = returnStartY + (originalPositionRef.current!.y - returnStartY) * returnFinalProgress;

              setPosition({ x: returnX, y: returnY });

              if (returnProgress < 1) {
                crawlAnimationRef.current = requestAnimationFrame(returnAnimate);
              } else {
                crawlAnimationRef.current = null;
                setIsCrawling(false);
                isCrawlingRef.current = false;
                originalPositionRef.current = null;
              }
            };

            crawlAnimationRef.current = requestAnimationFrame(returnAnimate);
          } else {
            crawlAnimationRef.current = null;
            setIsCrawling(false);
            isCrawlingRef.current = false;
            originalPositionRef.current = null;
          }
        }, 1000); // Wait 1 second before returning
      }
    };

    crawlAnimationRef.current = requestAnimationFrame(animate);
  }, [isPreview, isLoaded, isDragging, dialogOpen, position, playCrawlMotion]);

  // Update ref whenever performCrawlAnimation changes
  useEffect(() => {
    performCrawlAnimationRef.current = performCrawlAnimation;
  }, [performCrawlAnimation]);

  // Cleanup animation on unmount or when dragging starts
  useEffect(() => {
    if (isDragging || dialogOpen) {
      stopCrawlAnimation();
    }
  }, [isDragging, dialogOpen, stopCrawlAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (crawlAnimationRef.current) {
        cancelAnimationFrame(crawlAnimationRef.current);
      }
    };
  }, []);

  // Inactivity detection - DISABLED (user requested no automatic crawling)
  useInactivity({
    timeout: 15000,
    enabled: false, // Disabled automatic crawling
    onInactive: () => {
      // Crawl animation disabled by user request
    },
  });

  // Always render container, even if model is not loaded yet
  return (
    <>
      <div
        ref={canvasRef}
        className={`${styles.live2dWidget} ${isDragging ? styles.dragging : ''} ${isPreview ? styles.preview : ''} ${isCrawling ? styles.crawling : ''}`}
        style={{
          ...(isPreview ? {} : {
            left: `${position.x}px`,
            top: `${position.y}px`,
          }),
          opacity: isLoaded ? 1 : 0.5,
        }}
        onMouseDown={isPreview || isCrawling ? undefined : handleMouseDown}
        onTouchStart={isPreview || isCrawling ? undefined : handleTouchStart}
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
      <ELOChatDialog
        open={dialogOpen}
        onClose={() => {
          console.log('[ELO] Dialog closing');
          setDialogOpen(false);
          // Don't close tip when dialog closes - tips can show independently
        }}
        position={position}
        onSendToDashboard={handleSendToDashboard}
        currentPage={getCurrentPage()}
        onShowTip={(message, type, duration) => {
          console.log('[ELO] Showing tip from dialog:', { message, type, duration });
          setTipMessage(message);
          setTipType(type || 'info');
          setTipDuration(duration || 0);
          setTipVisible(true);
        }}
      />
      <ELOTipBubble
        message={tipMessage}
        type={tipType}
        duration={tipDuration}
        position={position}
        visible={tipVisible}
        onClose={() => setTipVisible(false)}
      />
    </>
  );
}
