<script setup>
const id = useRoute().params.id[0];
const workout = ref(null);
onMounted(async () => {
  workout.value = await getWorkout(id);
});
</script>
<template>
  <Timer v-if="workout" :workout="workout" />
  <div class="h-screen w-screen flex items-center justify-center" v-else>
    <UIcon
      class="text-primary w-6 h-6 animate-spin"
      name="i-heroicons-arrow-path-20-solid"
    />
  </div>
</template>
