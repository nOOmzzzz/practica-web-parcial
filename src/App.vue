<script>
  import CustomerRequestView from "./crm/pages/customer-request-view.component.vue";
  import {defineComponent} from "vue";

  export default defineComponent({
    components: {CustomerRequestView}
  })


</script>

<template>
  <customer-request-view/>
</template>

<style scoped>
  header {
    flex: 0 0 auto;

  }


</style>
