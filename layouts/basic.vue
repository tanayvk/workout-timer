<template>
  <div class="h-screen flex flex-col justify-between">
    <div>
      <nav class="w-full h-12 flex justify-between items-center px-1">
        <div></div>
        <div class="space-x-1">
          <!-- <UButton -->
          <!--   color="gray" -->
          <!--   variant="ghost" -->
          <!--   icon="i-heroicons-cog-8-tooth" -->
          <!-- /> -->
          <DarkModeSwitch />
        </div>
      </nav>
      <slot />
    </div>
    <footer
      class="flex flex-col md:flex-row md:justify-between items-center pt-4 pb-2 px-2 gap-1"
    >
      <div class="dark:text-gray-400 flex items-center space-x-1">
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
      <div class="text-gray-800 dark:text-gray-400 flex items-center space-x-2">
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
    </footer>
  </div>
</template>
