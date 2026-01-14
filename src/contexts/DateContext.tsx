import { createContext, useContext, useState, ReactNode } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  startOfSelectedDay: Date;
  endOfSelectedDay: Date;
  isToday: boolean;
}

const DateContext = createContext<DateContextType | null>(null);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const startOfSelectedDay = startOfDay(selectedDate);
  const endOfSelectedDay = endOfDay(selectedDate);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <DateContext.Provider value={{ 
      selectedDate, 
      setSelectedDate, 
      startOfSelectedDay, 
      endOfSelectedDay,
      isToday 
    }}>
      {children}
    </DateContext.Provider>
  );
}

export function useSelectedDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used within a DateProvider');
  }
  return context;
}
