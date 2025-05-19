<script>
  import LanguageSwitcher from "./public/components/language-switcher.component.vue";
  import FooterContent from "./public/components/footer-content.component.vue";

  export default {
    name: 'app',
    components: {FooterContent, LanguageSwitcher},
    data(){
      return{
        drawer: false,
        items: [
          {label: 'option.home', to: '/home'},
          {label: 'option.about', to: '/about'},
          {label: 'Custom', to: '/Bounded'}
        ]
      }
    },
    methods: {
      toggleDrawer() {
        this.drawer = !this.drawer;
      }
    }
  }
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <header>
    <pv-toolbar class="bg-primary">
        <template #start>
          <h2>Practice for pc1</h2>
        </template>
        <template #center>
          <div class="flex justify-content-center align-items-center w-full">
            <pv-button v-for="item in items" :key="item.label" as-child v-slot="slotProps">
              <router-link :to="item.to" :class="slotProps['class']">{{ $t(item.label) }}</router-link>
            </pv-button>
          </div>
        </template>
      <template #end>
      <language-switcher/>
      </template>
    </pv-toolbar>
    <pv-drawer v-model:visible="drawer"/>
  </header>
  <main>
    <router-view/>
  </main>
  <footer>
    <footer-content/>
  </footer>
</template>

<style scoped>
  header {
    flex: 0 0 auto;

  }


</style>
