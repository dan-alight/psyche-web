import { create } from "zustand";

interface CalendarGenerationJobIdStore {
  calendarGenerationJobIds: Record<string, number | null>;
  setJobId: (date: string, jobId: number | null) => void;
}

export const useCalendarGenerationJobIdStore =
  create<CalendarGenerationJobIdStore>((set) => ({
    calendarGenerationJobIds: {},
    setJobId: (date: string, jobId: number | null) =>
      set((state) => {
        return {
          calendarGenerationJobIds: {
            ...state.calendarGenerationJobIds,
            [date]: jobId,
          },
        };
      }),
  }));
