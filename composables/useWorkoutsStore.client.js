import { defineStore } from "pinia";

export const useWorkoutsStore = defineStore("workouts", {
  state: () => ({ workouts: [], loaded: false }),
  actions: {
    setWorkouts(workouts) {
      this.loaded = true;
      this.workouts = workouts;
    },
  },
});

export const updateWorkouts = async () => {
  const w = await getWorkouts();
  useWorkoutsStore().setWorkouts(w);
};
