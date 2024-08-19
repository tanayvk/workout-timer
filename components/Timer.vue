<script setup>
const { workout } = defineProps(["workout"]);
const { id, exercises } = workout;

const currExerciseIndex = ref(0),
  remainingTime = ref((exercises[0].time || 0) * 1000),
  startTime = ref(0),
  isPaused = ref(true),
  timer = ref(remainingTime.value),
  elapsedTime = ref(null),
  eventLog = ref([]),
  addedLog = ref(null),
  showCongrats = ref(false),
  confirmed = ref(false),
  showExit = ref(false),
  interval = ref(null),
  wakeLock = ref(null);

const curExercise = computed(() => exercises[currExerciseIndex.value]);
const showTime = computed(() => {
  if (curExercise.value.time > 0) return getTimerString(timer.value);
  return getTimerString(timer.value, true);
});

const beepSound = new Audio("/beep.wav");
const doneSound = new Audio("/done.wav");
const beeps = [
  { time: 0, sound: doneSound },
  { time: 1000, sound: beepSound },
  { time: 2000, sound: beepSound },
  { time: 3000, sound: beepSound },
];
const beepRefs = {};
for (const beep of beeps) {
  beepRefs[beep.time] = ref(false);
}

function updateTimer() {
  if (showCongrats.value) return;
  if (eventLog.value.length) {
    elapsedTime.value = getTimerString(
      new Date().getTime() - eventLog.value[0].time,
    );
  }
  if (isPaused.value) return;
  timer.value = remainingTime.value - (new Date().getTime() - startTime.value);
  for (const beep of beeps) {
    if (timer.value > beep.time) beepRefs[beep.time].value = true;
    else if (timer.value <= beep.time && beepRefs[beep.time].value) {
      beepRefs[beep.time].value = false;
      beep.sound.play();
    }
  }
  if (timer.value < 0 && curExercise.value.autoDone) done();
}

function pause() {
  if (!isPaused.value) {
    eventLog.value.push({
      time: new Date().getTime(),
      type: "pause",
    });
    isPaused.value = true;
    remainingTime.value = timer.value;
  }
}

function resume() {
  if (isPaused.value) {
    eventLog.value.push({
      time: new Date().getTime(),
      exercise: curExercise.value.title,
      type: "resume",
    });
    isPaused.value = false;
    startTime.value = new Date().getTime();
  }
}

function log() {
  isPaused.value = true;
  addLog(
    id,
    eventLog.value,
    eventLog.value[eventLog.value.length - 1].time - eventLog.value[0].time,
  ).then((log) => (addedLog.value = log));
}

function done() {
  const event = {
    time: new Date().getTime(),
    type: "done",
  };
  if (currExerciseIndex.value < exercises.length - 1) {
    currExerciseIndex.value++;
    const exercise = exercises[currExerciseIndex.value];
    event.next = exercise.title;
    remainingTime.value = timer.value = (exercise.time || 0) * 1000;
    startTime.value = new Date().getTime();
    eventLog.value.push(event);
  } else {
    eventLog.value.push(event);
    showCongrats.value = true;
    log();
  }
}

async function exit() {
  confirmed.value = true;
  const event = {
    time: new Date().getTime(),
    type: "exit",
  };
  eventLog.value.push(event);
  log();
}

onMounted(async () => {
  interval.value = setInterval(updateTimer, 50);
  if ("wakeLock" in navigator) {
    wakeLock.value = await navigator.wakeLock.request("screen");
  }
});
onUnmounted(async () => {
  if (wakeLock.value) {
    await wakeLock.value.release();
    wakeLock.value = null;
  }
  clearInterval(interval.value);
});

watch([confirmed, addedLog], () => {
  if (confirmed.value && addedLog.value) {
    navigateTo("/workouts/" + id + "?tab=logs&log=" + addedLog.value);
  }
});

defineShortcuts({
  " ": {
    handler: () => {
      if (isPaused.value) resume();
      else done();
    },
  },
});
</script>
<template>
  <div class="relative w-screen h-screen flex items-center justify-center">
    <UButton
      icon="i-heroicons-arrow-right-start-on-rectangle-16-solid"
      class="absolute right-2 top-2"
      variant="soft"
      color="red"
      @click="showExit = true"
      >Exit</UButton
    >
    <UContainer>
      <UBadge
        v-if="elapsedTime"
        color="primary"
        variant="soft"
        size="lg"
        class="absolute left-2 top-2 select-none font-timer"
        >{{ elapsedTime }}</UBadge
      >
      <div class="space-y-6">
        <UAlert
          color="primary"
          variant="soft"
          icon="i-heroicons-information-circle"
        >
          <template #title>
            {{
              currExerciseIndex === exercises.length - 1
                ? "Final Exercise"
                : "Next Exercise"
            }}
          </template>
          <template #description>
            <span v-if="currExerciseIndex === exercises.length - 1">
              You’re almost done!
            </span>
            <span v-else>
              {{ exercises[currExerciseIndex + 1].title }}
              {{
                showDuration(
                  exercises[currExerciseIndex + 1].time,
                  true,
                  true,
                  " - ",
                )
              }}
            </span>
          </template>
        </UAlert>
        <div
          :class="[
            'relative overflow-hidden rounded-lg p-4 text-primary-500',
            'dark:text-primary-400 ring-1 ring-inset ring-primary-500 dark:ring-primary-400',
            'text-xl flex items-center justify-center space-x-2',
          ]"
        >
          <span class="text-lg font-bold">
            {{ `${currExerciseIndex + 1} of ${exercises.length}:` }}
          </span>
          <span>{{ curExercise.title }}</span>
        </div>
        <UBadge
          :color="curExercise.time > 0 && timer < -500 ? 'red' : 'primary'"
          variant="subtle"
          size="xl"
          class="select-none px-4 text-timer-sm md:text-timer font-timer"
          >{{ showTime }}</UBadge
        >
        <div class="space-x-2 w-full text-center">
          <UButton
            v-if="isPaused"
            variant="solid"
            icon="i-heroicons-play-solid"
            @click="resume"
            color="blue"
            >Play</UButton
          >
          <UButton
            v-else
            variant="outline"
            icon="i-heroicons-pause-20-solid"
            @click="pause"
            color="blue"
            >Pause</UButton
          >
          <UButton
            v-if="!isPaused"
            icon="i-heroicons-check-20-solid"
            variant="outline"
            color="green"
            @click="done"
            >Done</UButton
          >
        </div>
      </div>
    </UContainer>
  </div>
  <UModal v-model="showExit">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 text-red-400">
          <UIcon name="i-heroicons-arrow-right-start-on-rectangle-16-solid" />
          <span class="font-medium">Exit</span>
        </div>
      </template>
      Are you sure you want to exit the workout?
      <template #footer>
        <div class="flex items-center space-x-2">
          <UButton
            :loading="confirmed"
            @click="exit"
            color="red"
            variant="outline"
            >Confirm Exit</UButton
          >
          <UButton @click="showExit = false" variant="link" color="white"
            >Cancel</UButton
          >
        </div>
      </template>
    </UCard>
  </UModal>
  <UModal v-model="showCongrats" :prevent-close="true">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-medium">🎉 Well done!</span>
        </div>
      </template>
      You completed the workout in
      {{
        showDuration(eventLog[eventLog.length - 1]?.time - eventLog[0]?.time)
      }}!
      <template #footer>
        <div class="flex items-center space-x-2">
          <UButton
            :loading="confirmed"
            @click="confirmed = true"
            variant="outline"
            >View Workout Log</UButton
          >
        </div>
      </template>
    </UCard>
  </UModal>
</template>
