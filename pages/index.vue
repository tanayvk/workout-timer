<script setup>
import { onMounted } from "vue";

const workouts = ref(null);
const creatingWorkout = ref(false);

onMounted(init);

async function createWorkout() {
  creatingWorkout.value = true;
  const id = await createNewWorkout();
  useRouter().push(`/workouts/${id}`);
  creatingWorkout.value = false;
}

async function init() {
  workouts.value = await getWorkouts();
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
            :loading="creatingWorkout"
            @click="createWorkout"
            variant="outline"
            icon="i-heroicons-plus-16-solid"
            :disabled="workouts === null"
            >New Workout</UButton
          >
        </div>
      </template>
      <div
        class="h-32 flex items-center justify-center"
        v-if="workouts === null"
      >
        <UIcon
          class="text-primary w-6 h-6 animate-spin"
          name="i-heroicons-arrow-path-20-solid"
        />
      </div>
      <UAlert
        v-else-if="workouts.length === 0"
        color="blue"
        variant="subtle"
        icon="i-heroicons-information-circle"
        title="No workouts"
        description="Create a new workout to get started."
      />
      <div v-else>
        <UButton
          :to="'/workouts/' + workout.id"
          class="w-full"
          variant="ghost"
          v-for="workout in workouts"
          ><span>{{ workout.title }}</span></UButton
        >
      </div>
    </UCard>
  </UContainer>
</template>
