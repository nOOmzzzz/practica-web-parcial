<script>

import {Bounded} from "../model/bounded.entity.js";
import {BoundedService} from "../services/bounded.service.js";
import DataManager from "../../shared/components/data-manager.component.vue";
import CategoryItemCreateAndEditDialog from "../components/bounded-item-create-and-edit.component.vue";

export default {
  name: "bounded-management",
  components: {DataManager, CategoryItemCreateAndEditDialog},

  data(){
    return {
      title: {singular: "Bounded Item", plural: "Bounded Items"},
      boundedItems: [],
      bounded: new Bounded({}),
      selectedBoundedItems: [],
      boundedService: null,
      CreateAndEditDialogIsVisible: false,
      isEdit: false,
      submitted: false,
    }
  },

  methods: {
    isActionSuccessful(message){
      this.$toast.add({severity: "success", summary: "Success", detail: message, life: 3000});
    },

    findIndexByID(id){
      return this.boundedItems.findIndex(bounded => bounded.id === id);
    },

    onNewItem(){
      this.bounded= new Bounded({});
      this.isEdit = false;
      this.submitted = false;
      this.CreateAndEditDialogIsVisible = true;
      console.log(this.CreateAndEditDialogIsVisible);
    },

    onEditItem(item){
      this.bounded = new Bounded(item);
      this.isEdit = true;
      this.submitted = false;
      this.CreateAndEditDialogIsVisible = true;
    },

    onDeleteItem(item) {
      this.bounded = {...item};
      this.deleteBounded();
    },

    onDeleteSelectedItem(selectedItems){
      this.selectedBoundedItems = selectedItems;
      this.deleteSelectedBounded();
    },

    onCancelRequested(){
      this.CreateAndEditDialogIsVisible = false;
      this.submitted = false;
      this.isEdit = false;
    },

    onSaveRequested(item){
      console.log('onSaveRequested');
      this.submitted = true;
      if (this.bounded.name.trim()){
        if (item.id){
          this.updateBounded();
        }else {
          this.createBounded();
        }
        this.CreateAndEditDialogIsVisible = false;
        this.isEdit = true;
      }
    },

    createBounded() {
      this.boundedService.create(this.bounded).then(response => {
        let bounded = new Bounded(response.data);
        this.boundedItems.push(bounded);
        this.isActionSuccessful("Bounded created");
      }).catch(error => console.log(error));
    },

    updateBounded(){
      this.boundedService.update(this.bounded.id, this.bounded).then(response => {
        console.log("updateBounded");
        let index = this.findIndexByID(this.bounded.id);
        this.boundedItems[index]= new Bounded(response.data);
        console.log(this.boundedItems);
        this.isActionSuccessful("Bounded Updated");
      }).catch(error => console.log(error));
    },

    deleteBounded(){
      this.boundedService.delete(this.bounded.id).then(() => {
        let index = this.findIndexByID(this.bounded.id);
        this.boundedItems.splice(index, 1);
        this.isActionSuccessful("Bounded deleted");
      }).catch(error => console.log(error));
    },

    deleteSelectedBounded(){
      this.selectedBoundedItems.forEach((bounded) => {
        this.boundedService.delete(bounded.id).then(() => {
          this.boundedItems = this.boundedItems.filter((t) => t.id !== this.bounded.id);
        });
      });
      this.isActionSuccessful("Bounded deleted");
    }
  },

  created(){
    this.boundedService = new BoundedService();
    this.boundedService.getAll().then(response=> {
      this.boundedItems = response.data.map(bounded => new Bounded(bounded));
      console.log(this.boundedItems);
    }).catch(error => console.log(error));
  }
}
</script>

<template>
  <div class="w-full h-full">
    <data-manager :title="title"
                  :items="boundedItems"
                  @new-item-requested="onNewItem"
                  @edit-item-requested="onEditItem($event)"
                  @deleteItemRequested="onDeleteItem($event)"
                  @delete-selected-items-requested="onDeleteSelectedItem($event)">
      <template #custom-columns>
        <pv-column :sortable="true" field="id" header="Id" style="min-width: 12rem"/>
        <pv-column :sortable="true" field="name" header="Name" style="min-width: 24rem"/>
      </template>
    </data-manager>
    <category-item-create-and-edit-dialog
        :edit="isEdit"
        :item="bounded"
        :visible="CreateAndEditDialogIsVisible"
        @cancel-requested="onCancelRequested"
        @save-requested="onSaveRequested($event)"/>
  </div>
</template>

<style scoped>

</style>