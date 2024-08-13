<template>
  <nav class="w-full h-12 flex justify-between items-center px-1">
    <div></div>
    <div class="space-x-1">
      <UButton color="gray" variant="ghost" icon="i-heroicons-cog-8-tooth" />
      <DarkModeSwitch />
    </div>
  </nav>
  <ClientOnly>
    <slot />
    <div class="h-16"></div>
  </ClientOnly>
  <div
    class="fixed bottom-2 left-2 text-gray-800 dark:text-gray-400 flex items-center space-x-1"
  >
    <span>Built with</span
    ><UIcon class="text-rose-600" name="i-heroicons-heart-solid" /><span
      >by
      <UButton
        to="https://tanay.xyz"
        target="_blank"
        class="p-0"
        size="lg"
        variant="link"
        >Tanay Karnik</UButton
      ></span
    >
  </div>
  <div
    class="fixed bottom-2 right-2 text-gray-800 dark:text-gray-400 flex items-center space-x-2"
  >
    <UButton
      to="https://github.com/tanayvk/workout-timer"
      target="_blank"
      variant="ghost"
      color="gray"
      icon="fa6-brands-github"
    />
    <UButton
      to="https://x.com/tanayvk"
      target="_blank"
      variant="ghost"
      color="gray"
      icon="fa6-brands-x-twitter"
    />
  </div>
</template>
