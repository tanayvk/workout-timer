<script setup>
const loading = ref(true);
const site = ref(null);
const newDeviceId = ref("");
const deviceName = ref("");
const copied = ref(false);
const editingName = ref(false);
const adding = ref(false);
onMounted(async () => {
  site.value = await getSiteId();
  deviceName.value = await getDeviceName();
  loading.value = false;
});
async function addDevice() {
  adding.value = true;
  try {
    await syncPeer(newDeviceId.value);
  } catch {}
  adding.value = false;
  newDeviceId.value = "";
}
function editTitle() {
  editingName.value = true;
}
function stopEditName() {
  editingName.value = false;
  updateDeviceName(deviceName.value);
}
function copy() {
  navigator.clipboard.writeText(site.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
const peers = usePeers();
defineShortcuts({
  enter: {
    usingInput: "nameInput",
    handler: stopEditName,
  },
});
</script>

<template>
  <SpinLoader v-if="loading" />
  <UCard v-else>
    <template #header>
      <div class="space-y-0.5">
        <div class="flex items-center">
          <UInput
            @blur="stopEditName"
            v-if="editingName"
            v-model="deviceName"
            name="nameInput"
            autofocus
          />
          <UTooltip
            v-else
            text="Edit Device Name"
            :popper="{ placement: 'top', arrow: true }"
          >
            <div
              @click="editTitle"
              class="flex w-full md:w-full items-center cursor-text hover:bg-white/5"
            >
              <h1 class="text-2xl flex-grow md:flex-grow-0">
                {{ deviceName }}
              </h1>
              <UIcon class="w-6 h-6 ml-2" name="i-heroicons-pencil-square" />
            </div>
          </UTooltip>
        </div>
        <div @click="copy">
          <UTooltip
            :text="copied ? 'Copied!' : 'Copy Device ID'"
            class="w-fit cursor-pointer flex space-x-2 items-center"
            :popper="{ placement: 'right', arrow: true }"
          >
            <span class="text-sm">
              {{ site }}
            </span>
            <UIcon name="i-ic-baseline-content-copy" />
          </UTooltip>
        </div>
      </div>
    </template>
    <div class="space-y-3">
      <h2 class="font-semibold text-xl">Linked Devices</h2>
      <div class="flex space-x-2">
        <UInput
          v-model="newDeviceId"
          placeholder="Enter device ID to link"
          class="flex-grow"
        />
        <UButton
          :disabled="newDeviceId.length !== 32"
          :loading="adding"
          @click="addDevice"
          variant="solid"
          color="primary"
          >Add Device</UButton
        >
      </div>
      <div class="space-y-2 max-h-[400px] overflow-scroll">
        <div
          v-if="peers.length"
          v-for="peer in peers"
          :key="peer.id"
          class="flex flex-col p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <span class="text-md font-medium">{{ peer.name }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{
            peer.id
          }}</span>
        </div>
        <UAlert
          v-else
          color="primary"
          variant="soft"
          icon="i-heroicons-information-circle"
          title="No linked devices"
          description="Link a new device by entering the device ID and clicking 'Add Device'."
        />
      </div>
    </div>
  </UCard>
</template>
