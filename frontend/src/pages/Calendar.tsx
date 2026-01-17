import { Calendar, Layout, Button, message, Grid, Popover } from 'antd';
import {
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import Header from '../components/Header';
import { MELO_LOGO } from '../constants/assets';
import styles from './Calendar.module.css';
import { User } from '../services/authService';
import { CalendarItem, calendarService } from '../services/calendarService';
import CalendarItemModal from '../components/CalendarItemModal';
import PlatformIcon, { PLATFORM_COLORS } from '../components/PlatformIcon';

const { useBreakpoint } = Grid;
interface CalendarProps {
  isLoggedIn: boolean;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  user?: User | null;
}

// Draggable Item Component
function DraggableCalendarItem({ item, onClick, isMonthView = false }: { item: CalendarItem, onClick: (e: React.MouseEvent) => void, isMonthView?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id || '',
    data: item,
  });

  const color = PLATFORM_COLORS[item.platform] || '#10b981';
  const style = isDragging ? { opacity: 0.5 } : undefined;

  if (isMonthView) {
    return (
      <div
        className={styles.monthEventLabel}
        onClick={onClick}
        style={{ borderLeftColor: color }}
        data-demo-id={item.id === "demo-cal-1" ? "calendar-event-demo" : undefined}
      >
        <PlatformIcon platform={item.platform} style={{ marginRight: 4, fontSize: '11px', opacity: 0.65 }} />
        <span className={styles.eventLabelText}>{item.title}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.itemChip}
      onClick={onClick}
      style={style}
    >
      <PlatformIcon platform={item.platform} style={{ marginRight: 6, fontSize: '14px' }} />
      <span className={styles.itemTitle}>{item.title}</span>
    </div>
  );
}

// Droppable Date Cell Component
function DroppableDateCell({ date, children, isToday, onDateClick }: { date: Dayjs, children: React.ReactNode, isToday: boolean, onDateClick: (date: Dayjs) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.format('YYYY-MM-DD'),
    data: { date },
  });

  const style = isOver ? { backgroundColor: '#f0fdf4' } : undefined;

  return (
    <div
      ref={setNodeRef}
      className={styles.dateCellContent}
      style={style}
      onClick={() => onDateClick(date)}
    >
      {children}
      <div className={styles.addBtnOverlay}>
        <Button
          type="primary"
          size="small"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDateClick(date);
          }}
        />
      </div>
    </div>
  );
}

export default function CalendarPage({
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  user,
}: CalendarProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [value, setValue] = useState(dayjs());
  const [selectedValue, setSelectedValue] = useState<Dayjs>(dayjs());
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  // const [loading, setLoading] = useState(false); // Unused
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [activeDragItem, setActiveDragItem] = useState<CalendarItem | null>(null);
  const shouldOffsetForDrawer = modalOpen && !isMobile;

  useEffect(() => {
    document.body.classList.add('calendar-page');
    return () => {
      document.body.classList.remove('calendar-page');
    };
  }, []);

  // Show calendar reminder tip on page load
  useEffect(() => {
    if (isLoggedIn) {
      // Show reminder tip after a short delay
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('elo-show-tip', {
          detail: {
            message: "Don't forget to add events to your schedule! Remember to select 'Schedule' when creating content",
            type: 'reminder',
            duration: 8000,
          }
        }));
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Load calendar items
  const loadCalendarItems = useCallback(async () => {
    if (!isLoggedIn) return;

    // setLoading(true);
    try {
      const start = value.startOf('month').subtract(7, 'day');
      const end = value.endOf('month').add(7, 'day');

      const response = await calendarService.getCalendarItems(
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD')
      );

      if (response.success && response.items) {
        setCalendarItems(response.items);
      } else {
        message.error(response.message || 'Failed to load calendar items');
      }
    } catch (error) {
      console.error('Load calendar items error:', error);
      message.error('Failed to load calendar items');
    } finally {
      // setLoading(false);
    }
  }, [value, isLoggedIn]);

  useEffect(() => {
    loadCalendarItems();
  }, [loadCalendarItems]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key.toLowerCase() !== 't') return;
      const today = dayjs();
      setValue(today);
      setSelectedValue(today);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getItemsForDate = (date: Dayjs): CalendarItem[] => {
    const dateStr = date.format('YYYY-MM-DD');
    return calendarItems.filter((item) => item.date === dateStr);
  };

  // Event Handlers
  const onSelect = (newValue: Dayjs) => {
    setValue(newValue);
    setSelectedValue(newValue);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = calendarItems.find(i => i.id === active.id);
    if (item) setActiveDragItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const itemId = active.id as string;
    const newDateStr = over.id as string;
    const item = calendarItems.find(i => i.id === itemId);

    if (item && item.date !== newDateStr) {
      // Optimistic update
      const updatedItems = calendarItems.map(i =>
        i.id === itemId ? { ...i, date: newDateStr } : i
      );
      setCalendarItems(updatedItems);

      try {
        await calendarService.updateCalendarItem(itemId, { date: newDateStr });
        message.success('Moved to ' + newDateStr);
      } catch (error) {
        message.error('Failed to move item');
        loadCalendarItems(); // Revert on error
      }
    }
  };

  const handleNewItem = (platform?: string) => {
    setSelectedItem(platform ? { platform } as CalendarItem : null);
    setSelectedDate(selectedValue);
    setSelectedTime(undefined); // Reset time
    setModalOpen(true);
  };

  const handleDateQuickCreate = (date: Dayjs) => {
    setSelectedItem(null);
    setSelectedDate(date);
    setSelectedTime('10:00');
    setModalOpen(true);
  };

  const getRangeLabel = () => value.format('MMMM YYYY');

  const dateCellRender = (date: Dayjs) => {
    const items = getItemsForDate(date);
    const isToday = date.isSame(dayjs(), 'day');
    const maxDisplay = 2;
    const displayItems = items.slice(0, maxDisplay);
    const remainingCount = items.length - maxDisplay;
    const isCurrentMonth = date.month() === value.month();

    return (
      <DroppableDateCell date={date} isToday={isToday} onDateClick={handleDateQuickCreate}>
        <div className={styles.monthDateCell}>
          <div className={styles.monthDateNumber}>
            {isToday ? (
              <span className={styles.monthTodayCircle} style={{ fontVariantNumeric: 'normal' }}>
                {date.date().toLocaleString('en-US', { 
                  style: 'decimal',
                  useGrouping: false,
                  minimumIntegerDigits: 1
                })}
              </span>
            ) : (
              <span
                className={`${styles.monthDateText} ${!isCurrentMonth ? styles.otherMonthDate : ''}`}
                style={{ fontVariantNumeric: 'normal' }}
              >
                {date.date().toLocaleString('en-US', { 
                  style: 'decimal',
                  useGrouping: false,
                  minimumIntegerDigits: 1
                })}
              </span>
            )}
          </div>
          <div className={styles.monthEventsList}>
            {displayItems.map(item => (
              <DraggableCalendarItem
                key={item.id}
                item={item}
                isMonthView={true}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                  setModalOpen(true);
                }}
              />
            ))}
            {remainingCount > 0 && (
              <Popover
                placement="bottom"
                content={
                  <div className={styles.monthMorePopover}>
                    {items.slice(maxDisplay).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.monthMoreItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setModalOpen(true);
                        }}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className={styles.monthMoreIndicator}>+{remainingCount} more</div>
              </Popover>
            )}
          </div>
        </div>
      </DroppableDateCell>
    );
  };

  return (
    <Layout className={styles.layout}>
      <Header
        isLoggedIn={isLoggedIn}
        showBrandName={false}
        logoSrc={MELO_LOGO}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      {/* Sticky Header */}
      <div className={`${styles.headerBar} ${shouldOffsetForDrawer ? styles.drawerOffset : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => {
                setValue(value.subtract(1, 'month'));
              }}
              className={styles.dateNavBtn}
            />
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={() => {
                setValue(value.add(1, 'month'));
              }}
              className={styles.dateNavBtn}
            />
          </div>

          <div className={styles.headerCenter}>
            <button
              type="button"
              className={styles.currentDate}
              onClick={() => {
                const today = dayjs();
                setValue(today);
                setSelectedValue(today);
              }}
              title="Jump to current month"
            >
              {getRangeLabel()}
            </button>
          </div>

          <div className={styles.headerRight}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className={styles.addPostBtn}
              onClick={() => handleNewItem()}
            >
              New Event
            </Button>
          </div>
        </div>
      </div>

      <div className={`${styles.mainContent} ${shouldOffsetForDrawer ? styles.drawerOffset : ''}`}>
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.calendarSection}>
            <div className={styles.calendarContainer} data-demo-id="calendar-grid">
              <Calendar
                fullscreen={!isMobile}
                headerRender={() => null} // Custom header used above
                value={value}
                onSelect={onSelect}
                dateCellRender={dateCellRender}
                monthCellRender={() => null} // Disable default month cell
              />
            </div>
          </div>
          <DragOverlay>
            {activeDragItem ? (
              <div className={styles.monthEventLabel} style={{ transform: 'scale(1.05)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                <span className={styles.eventDot} />
                <span className={styles.eventLabelText}>{activeDragItem.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {isLoggedIn && (
        <CalendarItemModal
          open={modalOpen}
          item={selectedItem}
          defaultDate={selectedDate || undefined}
          defaultTime={selectedTime} // Pass specific time
          isMobile={isMobile}
          onClose={() => {
            setModalOpen(false);
            setSelectedItem(null);
            setSelectedDate(null);
            setSelectedTime(undefined);
          }}
          onSave={() => {
            loadCalendarItems();
            setModalOpen(false);
          }}
          onItemUpdate={(updatedItem) => {
            // Update selectedItem with the refreshed data
            setSelectedItem(updatedItem);
            // Refresh the calendar list
            loadCalendarItems();
            // Keep modal open to show the updated status
          }}
        />
      )}
    </Layout>
  );
}


