<template>
  <div class="simulation">
    <ConversationForm />
  </div>
</template>

<script>
import ConversationForm from "./ConversationForm.vue";

export default {
  name: "Simulation",
  components: {
    ConversationForm,
  },
};
</script>

<style scoped>
.simulation {
  padding: 2rem 0;
}
</style>
