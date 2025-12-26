import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { JobRead } from "@/types/api";

interface JobStore {
  jobs: Record<string, JobRead[] | undefined>;
  addJob: (url: string, job: JobRead) => void;
}

export const useJobStore = create<JobStore>()(
  immer((set) => ({
    jobs: {},
    addJob: (url: string, job: JobRead) =>
      set((state) => {
        (state.jobs[url] ||= []).push(job);
      })
  }))
);
