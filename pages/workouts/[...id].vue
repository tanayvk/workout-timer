<script setup>
const route = useRoute();
const router = useRouter();

const workout = ref(null);
const editingTitle = ref(route.query.new ? true : false);
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const id = useRoute().params.id[0];

onMounted(async () => {
  workout.value = await getWorkout(id);
  if (!workout.value) navigateTo("/");
  router.replace({ ...route.query, new: undefined });
});

function editTitle() {
  editingTitle.value = true;
}
function stopEditTitle() {
  editingTitle.value = false;
  updateWorkoutTitle(id, workout.value.title);
}
async function deleteWorkout() {
  deleting.value = true;
  await deleteWorkoutByID(id);
  deleting.value = false;
  navigateTo("/");
}

const tabs = [
  { label: "Exercises", icon: "i-ic-directions-run" },
  { label: "Logs", icon: "i-heroicons-clipboard-document-list" },
];
const selected = computed({
  get() {
    const index = tabs.findIndex(
      (item) => item.label.toLowerCase() === route.query.tab,
    );
    if (index === -1) {
      return 0;
    }
    return index;
  },
  set(value) {
    const tab = tabs[value].label.toLowerCase();
    router.replace({
      query: { ...route.query, tab },
    });
  },
});

defineShortcuts({
  enter: {
    usingInput: "titleInput",
    handler: stopEditTitle,
  },
});
definePageMeta({
  layout: "basic",
});
</script>
<template>
  <UButton
    to="/"
    class="absolute top-2 left-2"
    icon="i-heroicons-arrow-left-16-solid"
    variant="solid"
    color="white"
  />
  <UContainer>
    <UCard class="mt-10">
      <template v-if="workout" #header>
        <div class="flex flex-col md:flex-row md:justify-between">
          <div class="flex items-center mb-3 md:mb-0">
            <UInput
              @blur="stopEditTitle"
              v-if="editingTitle"
              v-model="workout.title"
              name="titleInput"
              autofocus
            />
            <div
              v-else
              @click="editTitle"
              class="flex w-full md:w-full items-center cursor-text hover:bg-white/5"
            >
              <h1 class="text-2xl flex-grow md:flex-grow-0">
                {{ workout.title }}
              </h1>
              <UIcon class="w-6 h-6 ml-2" name="i-heroicons-pencil-square" />
            </div>
          </div>
          <div class="space-x-2">
            <UButton :to="'/timer/' + id" icon="i-heroicons-play"
              >Start</UButton
            >
            <UButton
              @click="showDeleteConfirm = true"
              color="red"
              variant="outline"
              icon="i-heroicons-trash"
              :loading="deleting"
              >Delete</UButton
            >
          </div>
        </div>
      </template>
      <UTabs v-if="workout" v-model="selected" color="primary" :items="tabs">
        <template #item="{ item }">
          <div class="h-2"></div>
          <LazyExercises :workout="workout" v-if="item.label === 'Exercises'" />
          <Logs v-else :workout="workout" />
        </template>
      </UTabs>
      <div
        class="h-32 flex items-center justify-center"
        v-if="workout === null"
      >
        <UIcon
          class="text-primary w-6 h-6 animate-spin"
          name="i-heroicons-arrow-path-20-solid"
        />
      </div>
    </UCard>
  </UContainer>
  <UModal v-model="showDeleteConfirm">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 text-red-400">
          <UIcon name="i-heroicons-trash" />
          <span class="font-medium">Delete Workout</span>
        </div>
      </template>
      Are you sure you want to delete this workout?
      <template #footer>
        <div class="space-x-2">
          <UButton @click="deleteWorkout" color="red" variant="outline"
            >Yes</UButton
          >
          <UButton
            @click="showDeleteConfirm = false"
            variant="link"
            color="white"
            >No</UButton
          >
        </div>
      </template>
    </UCard>
  </UModal>
</template>
