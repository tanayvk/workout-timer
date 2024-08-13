<script setup>
const { log } = defineProps(["log"]);
</script>
<template>
  <div class="flex items-center">
    <UButton variant="link" @click="$emit('openLog')">
      {{ showLogText(log) }}
    </UButton>
    <span class="font-medium">{{ showDuration(log.time) }}</span>
  </div>
</template>
