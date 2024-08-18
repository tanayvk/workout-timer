export default defineNuxtPlugin({
  hooks: {
    "app:beforeMount"() {
      dbInit().then(() => {
        updateWorkouts();
        peerInit();
        const ready = useDBReady();
        ready.value = true;
      });
    },
  },
});
