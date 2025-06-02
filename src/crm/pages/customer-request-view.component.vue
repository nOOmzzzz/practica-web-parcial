<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import {
  getCustomerRequests,
  createCustomerRequest,
  deleteCustomerRequest,
  assignStaffToRequest,
  resolveCustomerRequest
} from '../service/customer-request.service'

import CustomerRequest from '../model/customer-request.entity.js'

const API_URL = 'http://localhost:3000'

// Reactive data
const requests = ref([])
const rooms = ref([])
const allRequests = ref([])
const pendingRequests = ref([])
const loading = ref(true)
const requestTypes = ref(['Toallas/Ropa', 'Limpieza', 'Reparación', 'Room Service', 'Otros'])
const priorityOptions = ref(['Baja', 'Media', 'Alta', 'Urgente'])
const selectedRoom = ref(null)
const requestDialog = ref(false)

const staffMembers = ref([
  { id: 4, name: 'Ana López', role: 'Housekeeping' },
  { id: 5, name: 'David Martínez', role: 'Technical Support' }
])

// Formulario
const requestForm = ref({
  roomId: null,
  type: null,
  description: '',
  priority: 'Media',
})

// Computed
const filteredRequests = computed(() => {
  if (!selectedRoom.value) return []
  return allRequests.value
      .filter(r => r.roomId === selectedRoom.value.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// Métodos
const getRoomRequests = (roomId) => {
  return allRequests.value.filter(request => request.roomId === roomId)
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'available': return 'success'
    case 'occupied': return 'warn'
    case 'cleaning': return 'info'
    case 'maintenance': return 'danger'
    default: return null
  }
}

const getRequestSeverity = (status) => {
  switch (status) {
    case 'Pending': return 'danger'
    case 'In process': return 'warn'
    case 'Resolved': return 'success'
    default: return 'info'
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' - ' +
      new Date(date).toLocaleDateString()
}

const openNewRequestForm = () => {
  requestForm.value = {
    roomId: selectedRoom.value?.id || null,
    type: null,
    description: '',
    priority: 'Media'
  }
  requestDialog.value = true
}

const saveRequest = async () => {
  const payload = {
    ...requestForm.value,
    userId: 1,
    hotelId: 1,
    status: 'pending'
  }

  const newRequest = await createCustomerRequest(payload)
  allRequests.value.push(newRequest)
  pendingRequests.value = allRequests.value.filter(req => req.status !== 'Resolved')
  requestDialog.value = false
}

const assignStaff = async (requestId, staffId) => {
  const updated = await assignStaffToRequest(requestId, staffId)
  const idx = requests.value.findIndex(r => r.id === requestId)
  if (idx > -1) requests.value[idx] = updated
  refreshData()
}

const deleteRequestById = async (id) => {
  await deleteCustomerRequest(id)
  requests.value = requests.value.filter(r => r.id !== id)
  refreshData()
}

const resolveRequest = async (id) => {
  const resolved = await resolveCustomerRequest(id)
  const idx = requests.value.findIndex(r => r.id === id)
  if (idx > -1) requests.value[idx] = resolved
  refreshData()
}

const fetchData = async () => {
  try {
    // Obtener datos en paralelo desde tus endpoints locales
    const [roomsRes, requestsRes] = await Promise.all([
      axios.get(`${API_URL}/rooms`),
      getCustomerRequests() // Usamos tu servicio existente
    ]);

    // Procesar habitaciones
    rooms.value = roomsRes.data?.map(room => ({
      id: room.id,
      number: room.number,
      type: room.type,
      status: room.status,
      // Calculamos el contador de peticiones pendientes
      pendingRequests: requestsRes.filter(req =>
          req.roomId === room.id && req.status !== 'Resolved'
      ).length
    })) || [];

    // Procesar peticiones
    allRequests.value = requestsRes;
    pendingRequests.value = requestsRes.filter(req =>
        req.status && !req.status.includes('Resolved')
    );

  } catch (error) {
    console.error('Error fetching data:', error);
    // Resetear estados en caso de error
    rooms.value = [];
    allRequests.value = [];
    pendingRequests.value = [];
  } finally {
    loading.value = false;
  }
}

const refreshData = () => {
  loading.value = true;
  fetchData();
};

onMounted(() => {
  fetchData()
})


</script>

<template>
  <div class="customer-request-view">
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="hotel-title text-xl font-bold">
        Hotel Cheraton - Peticiones del Huésped
      </div>
      <pv-button label="Nueva Petición" icon="pi pi-plus" @click="openNewRequestForm" />
    </div>
    <div class="grid">
      <!-- Sección de Habitaciones -->
      <div class="col-12 md:col-4">
        <pv-card class="h-full">
          <template #title>Habitaciones</template>
          <template #content>
            <pv-data-table
                :value="rooms"
                selectionMode="single"
                v-model:selection="selectedRoom"
                dataKey="id"
                class="p-datatable-sm"
            >
              <pv-column field="number" header="Número"></pv-column>
              <pv-column field="type" header="Tipo"></pv-column>
              <pv-column field="status" header="Estado">
                <template #body="{data}">
                  <pv-tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                </template>
              </pv-column>
              <pv-column header="Peticiones">
                <template #body="{data}">
                  <pv-badge :value="getRoomRequests(data.id).length" severity="danger" />
                </template>
              </pv-column>
            </pv-data-table>
          </template>
        </pv-card>
      </div>

      <!-- Sección de Peticiones -->
      <div class="col-12 md:col-8">
        <pv-card>
          <template #title>Peticiones Pendientes</template>
          <template #subtitle v-if="selectedRoom">
            Habitación #{{ selectedRoom.number }} - {{ selectedRoom.type }}
          </template>
          <template #content>
            <pv-data-table
                :value="filteredRequests"
                class="p-datatable-sm"
                :paginator="true"
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
            >
              <pv-column field="createdAt" header="Fecha">
                <template #body="{data}">
                  {{ formatDate(data.createdAt) }}
                </template>
              </pv-column>
              <pv-column field="type" header="Tipo"></pv-column>
              <pv-column field="description" header="Descripción"></pv-column>
              <pv-column field="status" header="Estado">
                <template #body="{data}">
                  <pv-tag :value="data.status" :severity="getRequestSeverity(data.status)" />
                </template>
              </pv-column>
              <pv-column field="assignedTo" header="Asignado a">
                <template #body="{data}">
                  <pv-select
                      v-model="data.assignedTo"
                      :options="staffMembers"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="Seleccionar personal"
                      @update:modelValue="assignStaff(data.id, data.assignedTo)"
                      class="w-full"
                      :clearable="true"
                  >
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <span>{{ slotProps.option.name }}</span>
                        <span class="ml-2 text-sm text-color-secondary">({{ slotProps.option.role }})</span>
                      </div>
                    </template>
                  </pv-select>
                </template>
              </pv-column>
              <pv-column header="Acciones">
                <template #body="{data}">
                  <pv-button
                      icon="pi pi-check"
                      class="p-button-sm p-button-text mr-2"
                      @click="resolveRequest(data.id)"
                      v-if="data.status !== 'Resuelto'"
                  />
                  <pv-button
                      icon="pi pi-trash"
                      class="p-button-sm p-button-text text-red-500"
                      @click="deleteRequestById(data.id)"
                  />
                </template>
              </pv-column>
            </pv-data-table>
          </template>
        </pv-card>
      </div>
    </div>

    <!-- Diálogo para nueva petición -->
    <pv-dialog v-model:visible="requestDialog" modal header="Nueva Petición" :style="{width: '500px'}">
      <form @submit.prevent="saveRequest">
        <div class="p-fluid">
          <div class="field mb-3">
            <label>Habitación</label>
            <pv-select
                v-model="requestForm.roomId"
                :options="rooms"
                optionLabel="number"
                optionValue="id"
                placeholder="Seleccione habitación"
                class="w-full"
                :filter="true"
                filterPlaceholder="Buscar habitación..."
            >
              <template #option="slotProps">
                <div>{{ slotProps.option.number }} - {{ slotProps.option.type }}</div>
              </template>
            </pv-select>
          </div>

          <div class="field mb-3">
            <label>Tipo de petición</label>
            <pv-select
                v-model="requestForm.type"
                :options="requestTypes"
                placeholder="Seleccione tipo"
                class="w-full"
            />
          </div>

          <div class="field mb-3">
            <label>Descripción</label>
            <pv-textarea
                v-model="requestForm.description"
                rows="3"
                placeholder="Detalles de la petición..."
                class="w-full"
                autoResize
            />
          </div>

          <div class="field mb-3">
            <label>Prioridad</label>
            <pv-select
                v-model="requestForm.priority"
                :options="priorityOptions"
                placeholder="Seleccione prioridad"
                class="w-full"
            >
              <template #option="slotProps">
                <div class="flex align-items-center gap-2">
                  <i class="pi" :class="{
                'pi-arrow-down': slotProps.option === 'Baja',
                'pi-arrow-right': slotProps.option === 'Media',
                'pi-arrow-up': slotProps.option === 'Alta',
                'pi-exclamation-triangle': slotProps.option === 'Urgente'
              }"></i>
                  <span>{{ slotProps.option }}</span>
                </div>
              </template>
            </pv-select>
          </div>
        </div>

        <div class="flex justify-content-end gap-2 mt-4">
          <pv-button label="Cancelar" class="p-button-text" @click="requestDialog = false" />
          <pv-button label="Guardar" type="submit" />
        </div>
      </form>
    </pv-dialog>
  </div>
</template>


<style scoped>
.customer-request-view {
  margin: 0;
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
}


:deep(.p-datatable .p-datatable-thead > tr > th),
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.3rem 0.5rem;
}

:deep(.p-card .p-card-title) {
  font-size: 0.9rem;
  padding: 0.5rem;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}
</style>