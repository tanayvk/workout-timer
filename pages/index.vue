<script setup>
const { loaded, workouts } = storeToRefs(useWorkoutsStore());
const creatingWorkout = ref(false);
async function createWorkout() {
  creatingWorkout.value = true;
  const id = await createNewWorkout();
  useRouter().push(`/workouts/${id}?new=1`);
  creatingWorkout.value = false;
}
function go(id) {
  useRouter().push(`/workouts/${id}`);
}
definePageMeta({
  layout: "basic",
});
</script>
<template>
  <UContainer>
    <UCard class="mt-10">
      <template #header>
        <div class="flex justify-between">
          <h1 class="text-2xl">Workouts</h1>
          <UButton
            v-if="loaded"
            :loading="creatingWorkout"
            @click="createWorkout"
            variant="outline"
            icon="i-heroicons-plus-16-solid"
            >New Workout</UButton
          >
        </div>
      </template>
      <div class="h-32 flex items-center justify-center" v-if="!loaded">
        <UIcon
          class="text-primary w-6 h-6 animate-spin"
          name="i-heroicons-arrow-path-20-solid"
        />
      </div>
      <UAlert
        v-if="loaded && workouts.length === 0"
        color="blue"
        variant="subtle"
        icon="i-heroicons-information-circle"
        title="No workouts"
        description="Create a new workout to get started."
      />
      <div v-if="loaded && workouts.length > 0">
        <div :key="workout.id" v-for="workout in workouts">
          <UButton @click="go(workout.id)" class="w-full" variant="ghost">{{
            workout.title
          }}</UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
