export default defineNuxtPlugin({
  hooks: {
    "app:beforeMount"() {
      init().then(() => {
        const ready = useDBReady();
        ready.value = true;
      });
    },
  },
});
