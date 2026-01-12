import { Calendar, Layout, Button, Space, message, Grid, Segmented, Select, Input, Popover, Badge } from 'antd';
import { 
  PlusOutlined, 
  LeftOutlined, 
  RightOutlined, 
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  CalendarOutlined as CalendarIcon
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import Header from '../components/Header';
import { MELO_LOGO } from '../constants/assets';
import styles from './Calendar.module.css';
import { User } from '../services/authService';
import { CalendarItem, calendarService } from '../services/calendarService';
import CalendarItemModal, { PLATFORMS } from '../components/CalendarItemModal';
import CalendarDetailPanel from '../components/CalendarDetailPanel';
import WeekView from '../components/WeekView';
import DayView from '../components/DayView';
import YearView from '../components/YearView';

const { useBreakpoint } = Grid;
const { Option } = Select;

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

  const platformColors: Record<string, string> = {
    instagram_post: '#E1306C',
    instagram_story: '#F77737',
    instagram_reels: '#833AB4',
    tiktok: '#000000',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
  };

  const color = platformColors[item.platform] || '#0071e3';
  const style = isDragging ? { opacity: 0.5 } : undefined;

  if (isMonthView) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={styles.monthEventLabel}
        onClick={onClick}
        style={{ ...style, borderLeftColor: color }}
      >
        <span className={styles.eventDot} style={{ backgroundColor: color }} />
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
      <span className={styles.platformDot} style={{ backgroundColor: color }} />
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

  const style = isOver ? { backgroundColor: '#f0f7ff' } : undefined;

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
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [activeDragItem, setActiveDragItem] = useState<CalendarItem | null>(null);
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Load calendar items
  const loadCalendarItems = useCallback(async () => {
    if (!isLoggedIn) return;

    setLoading(true);
    try {
      // Determine date range based on view mode
      let start: Dayjs, end: Dayjs;
      if (viewMode === 'Week') {
        start = value.startOf('week');
        end = value.endOf('week');
      } else if (viewMode === 'Day') {
        start = value.startOf('day');
        end = value.endOf('day');
      } else {
        start = value.startOf('month').subtract(7, 'day');
        end = value.endOf('month').add(7, 'day');
      }

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
      setLoading(false);
    }
  }, [value, isLoggedIn, viewMode]);

  useEffect(() => {
    loadCalendarItems();
  }, [loadCalendarItems]);

  // Helpers
  const getFilteredItems = (items: CalendarItem[]) => {
    if (selectedPlatforms.length === 0) return items;
    return items.filter(item => selectedPlatforms.includes(item.platform));
  };

  const getItemsForDate = (date: Dayjs): CalendarItem[] => {
    const dateStr = date.format('YYYY-MM-DD');
    const items = calendarItems.filter((item) => item.date === dateStr);
    return getFilteredItems(items);
  };

  const getUpcomingWeekItems = (): CalendarItem[] => {
    const today = dayjs().startOf('day');
    const nextWeek = today.add(7, 'day');
    const items = calendarItems.filter((item) => {
      const itemDate = dayjs(item.date).startOf('day');
      return (itemDate.isSame(today) || itemDate.isAfter(today)) && itemDate.isBefore(nextWeek);
    });
    return getFilteredItems(items).sort((a, b) => a.date.localeCompare(b.date));
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

  // Handler specifically for WeekView time slot clicks
  const handleTimeSlotClick = (date: Dayjs, time: string) => {
    setSelectedItem(null);
    setSelectedDate(date);
    setSelectedTime(time); // Set specific time
    setModalOpen(true);
  };

  const dateCellRender = (date: Dayjs) => {
    const items = getItemsForDate(date);
    const isToday = date.isSame(dayjs(), 'day');
    const maxDisplay = 3;
    const displayItems = items.slice(0, maxDisplay);
    const remainingCount = items.length - maxDisplay;

    return (
      <DroppableDateCell date={date} isToday={isToday} onDateClick={() => setSelectedValue(date)}>
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
              <span className={styles.monthDateText} style={{ fontVariantNumeric: 'normal' }}>
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
              <div className={styles.monthMoreIndicator}>
                {remainingCount} →
              </div>
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
      <div className={styles.headerBar}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft} />
          
          <div className={styles.headerCenter}>
            <Button 
              type="text" 
              icon={<LeftOutlined />} 
              onClick={() => {
                const mode = viewMode === 'Week' ? 'week' : viewMode === 'Day' ? 'day' : 'month';
                const newValue = value.subtract(1, mode);
                setValue(newValue);
              }}
            />
            <div className={styles.currentDate}>
              {viewMode === 'Year' ? value.format('YYYY') : value.format('MMMM YYYY')}
            </div>
            <Button 
              type="text" 
              icon={<RightOutlined />} 
              onClick={() => {
                const mode = viewMode === 'Week' ? 'week' : viewMode === 'Day' ? 'day' : 'month';
                const newValue = value.add(1, mode);
                setValue(newValue);
              }}
            />
            <Button
              size="small"
              onClick={() => {
                const today = dayjs();
                setValue(today);
                setSelectedValue(today);
                setViewMode('Day');
              }}
            >
              Today
            </Button>
            <Segmented 
              options={['Day', 'Week', 'Month', 'Year']} 
              value={viewMode} 
              onChange={(v) => setViewMode(v as any)}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div className={styles.headerRight}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className={styles.addPostBtn}
              onClick={() => handleNewItem()}
            >
              Add Post
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <Select defaultValue="all" style={{ width: 120 }} bordered={false}>
          <Option value="all">All Brands</Option>
        </Select>
        <Select 
          mode="multiple" 
          placeholder="Filter by platform"
          allowClear
          style={{ minWidth: 200 }}
          value={selectedPlatforms}
          onChange={setSelectedPlatforms}
          suffixIcon={<FilterOutlined />}
          maxTagCount="responsive"
          bordered={false}
        >
          <Option value={PLATFORMS.INSTAGRAM_POST}>Instagram Post</Option>
          <Option value={PLATFORMS.INSTAGRAM_STORY}>Instagram Story</Option>
          <Option value={PLATFORMS.INSTAGRAM_REELS}>Instagram Reels</Option>
          <Option value={PLATFORMS.TIKTOK}>TikTok</Option>
          <Option value={PLATFORMS.FACEBOOK}>Facebook</Option>
          <Option value={PLATFORMS.TWITTER}>Twitter/X</Option>
          <Option value={PLATFORMS.LINKEDIN}>LinkedIn</Option>
        </Select>
        <Select defaultValue="all" style={{ width: 100 }} bordered={false}>
          <Option value="all">All Status</Option>
          <Option value="scheduled">Scheduled</Option>
          <Option value="draft">Draft</Option>
        </Select>
        <Input 
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
          placeholder="Search..." 
          bordered={false} 
          style={{ width: 200, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }} 
        />
      </div>

      <div className={styles.mainContent}>
        {viewMode === 'Day' ? (
          <div className={styles.calendarSection}>
            <DayView 
              currentDate={value}
              items={getFilteredItems(calendarItems)}
              onTimeSlotClick={handleTimeSlotClick}
              onItemClick={(item) => { setSelectedItem(item); setModalOpen(true); }}
            />
          </div>
        ) : viewMode === 'Week' ? (
          <div className={styles.calendarSection}>
            <WeekView 
              currentDate={value}
              items={getFilteredItems(calendarItems)}
              onTimeSlotClick={handleTimeSlotClick}
              onItemClick={(item) => { setSelectedItem(item); setModalOpen(true); }}
            />
          </div>
        ) : viewMode === 'Year' ? (
          <div className={`${styles.calendarSection} ${styles.yearViewSection}`}>
            <YearView
              currentDate={value}
              items={getFilteredItems(calendarItems)}
              onMonthClick={(date) => {
                setValue(date);
                setViewMode('Month');
              }}
              onItemClick={(item) => { setSelectedItem(item); setModalOpen(true); }}
            />
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={styles.calendarSection}>
              <div className={styles.calendarContainer}>
                <div className={styles.monthHeader}>
                  <h2 className={styles.monthTitle}>{value.format('MMMM YYYY')}</h2>
                </div>
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
        )}

        {viewMode !== 'Year' && (
          <CalendarDetailPanel 
            selectedDate={selectedValue}
            items={getItemsForDate(selectedValue)}
            upcomingItems={getUpcomingWeekItems()}
            onAddItem={() => handleNewItem()}
            onEditItem={(item) => { setSelectedItem(item); setModalOpen(true); }}
            onDeleteItem={async (id) => {
              await calendarService.deleteCalendarItem(id);
              loadCalendarItems();
            }}
          />
        )}
      </div>

      {/* Modals */}
      {isLoggedIn && (
        <CalendarItemModal
          open={modalOpen}
          item={selectedItem}
          defaultDate={selectedDate || undefined}
          defaultTime={selectedTime} // Pass specific time
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
        />
      )}
    </Layout>
  );
}
