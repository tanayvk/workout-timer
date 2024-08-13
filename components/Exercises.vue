<script setup>
import { Sortable } from "@shopify/draggable";
import { nextTick } from "vue";
const { workout } = defineProps(["workout"]);
const exercises = ref(workout.exercises);
console.log("here", workout.exercises);
const adding = ref(false);
async function add() {
  adding.value = true;
  const exercise = await addExercise(
    workout.id,
    exercises.value[exercises.value.length - 1].id,
  );
  exercises.value.push(exercise);
  adding.value = false;
  nextTick(() => {
    makeSortable();
  });
}
function remove(index) {
  const id = exercises.value[index].id;
  exercises.value.splice(index, 1);
  deleteExercise(id);
}
const debouncedUpdateExercise = debounce(async (index) => {
  const exercise = exercises.value[index];
  console.log("updating", exercise);
  await updateExercise(
    exercise.id,
    exercise.title,
    exercise.time,
    exercise.autoDone,
  );
}, 500);
function update(index) {
  debouncedUpdateExercise(index);
}
const sortableRef = ref(null);
const sortable = ref(null);
onMounted(() => {
  makeSortable();
});
function makeSortable() {
  if (sortable.value) sortable.value.destroy();
  sortable.value = new Sortable(sortableRef.value, {
    draggable: "div.draggable",
    handle: ".handle",
  });
  sortable.value.on("sortable:stop", (event) => {
    const source = event?.data?.dragEvent?.data?.source;
    if (source) {
      const sourceIndex = parseInt(source.dataset.index);
      const newIndex =
        parseInt(source.previousElementSibling?.dataset?.index ?? -1) + 1;
      if (newIndex !== sourceIndex) {
        moveExercise(
          source.dataset.id,
          source.previousElementSibling?.dataset?.id || null,
        );
        exercises.value.splice(newIndex, 0, exercises.value[sourceIndex]);
        exercises.value.splice(
          sourceIndex + (newIndex < sourceIndex ? 1 : 0),
          1,
        );
      }
    }
  });
}
const totalTime = computed(() => {
  let time = 0;
  exercises.value.forEach((e) => (time += parseInt(e.time) * 1000 || 0));
  return time;
});
</script>
<template>
  <div class="mb-4 flex items-center space-x-2">
    <h2 class="font-semibold text-xl">Exercises</h2>
    <span>({{ showDuration(totalTime) }})</span>
  </div>
  <div>
    <div ref="sortableRef">
      <div
        class="z-0 draggable mb-2"
        :data-id="exercise.id"
        :data-index="idx"
        :key="exercise.id"
        v-for="(exercise, idx) in exercises"
      >
        <div class="flex gap-x-2 items-center">
          <UButton
            class="handle cursor-grab"
            variant="ghost"
            icon="i-heroicons-bars-3-solid"
          />
          <UInput
            v-model="exercise.title"
            placeholder="describe the exercise..."
            class="flex-grow"
            @input="update(idx)"
          />
          <UInput
            @input="update(idx)"
            v-model="exercise.time"
            placeholder="time in seconds"
          />
          <UTooltip
            :popper="{ placement: 'right', arrow: true }"
            text="Mark done automatically"
          >
            <UCheckbox
              v-model="exercise.autoDone"
              :ui="{ base: 'w-6 h-6' }"
              @input="update(idx)"
            />
          </UTooltip>
          <UButton
            @click="remove(idx)"
            :disabled="exercises.length === 1"
            color="red"
            icon="i-heroicons-trash"
            variant="outline"
          />
        </div>
      </div>
    </div>
    <UButton
      @click="add"
      block
      variant="outline"
      icon="i-heroicons-plus-16-solid"
      :loading="adding"
      >Add Exercise</UButton
    >
  </div>
</template>
