<script setup>
const { workout } = defineProps(["workout"]);
const logs = ref(null);
const selectedLog = ref(null);

const route = useRoute();
const router = useRouter();
onMounted(async () => {
  logs.value = await getLogs(workout.id);
  const logId = route.query.log;
  if (logId) {
    selectedLog.value = logs.value.find((log) => log.id === logId);
  }
});

function handleLogClick(log) {
  selectedLog.value = log;
  router.replace({
    query: { ...route.query, log: log.id },
  });
}
function handleLogClose() {
  selectedLog.value = null;
  router.replace({
    query: { ...route.query, log: undefined },
  });
}
function getColumns() {
  return [
    { key: "index", label: "#" },
    { key: "exercise", label: "Exercise" },
    { key: "time", label: "Time" },
  ];
}
function getRows(log) {
  const rows = [];
  for (let i = 1; i < log.data.length; i++) {
    const pause = log.data[i - 1].type === "pause";
    rows.push({
      index: i,
      exercise: pause
        ? "PAUSE"
        : log.data[i - 1].next || log.data[i - 1].exercise,
      time: showDuration(log.data[i].time - log.data[i - 1].time),
      class: pause && "bg-gray-100 dark:bg-gray-800",
    });
  }
  return rows;
}
</script>

<template>
  <SpinLoader v-if="!logs" />
  <div v-else-if="selectedLog">
    <div class="mb-4 flex justify-between">
      <h3 class="text-lg font-semibold">{{ showLogText(selectedLog) }}</h3>
      <UButton
        @click="handleLogClose"
        icon="i-heroicons-x-mark-solid"
        color="white"
        square
      />
    </div>
    <div class="border-gray-300 dark:border-gray-700 border rounded-lg">
      <UTable :rows="getRows(selectedLog)" :columns="getColumns()" />
    </div>
  </div>
  <div v-else>
    <h2 class="mb-4 font-semibold text-xl">Logs</h2>
    <UAlert
      v-if="logs.length === 0"
      color="blue"
      variant="subtle"
      icon="i-heroicons-information-circle"
      title="No logs"
      description="Start tracking your workouts to see logs here."
    />
    <div v-else>
      <LogListItem
        v-for="log in logs"
        :key="log.id"
        :log="log"
        @open-log="handleLogClick(log)"
      />
    </div>
  </div>
</template>
