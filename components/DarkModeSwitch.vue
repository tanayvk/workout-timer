<script setup>
const colorMode = useColorMode();
const switchMode = () => {
  const modes = ["system", "light", "dark"];
  colorMode.preference =
    modes[(modes.indexOf(colorMode.preference) + 1) % modes.length];
};
const icons = {
  system: "i-heroicons-computer-desktop-20-solid",
  light: "i-heroicons-sun",
  dark: "i-heroicons-moon",
};
</script>
<template>
  <UButton
    color="gray"
    variant="ghost"
    @click="switchMode"
    :icon="icons[colorMode.preference]"
  />
</template>
