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

import CustomerRequestFormDialog from '../components/customer-request-form-dialog.vue'
import CustomerRequestRoomsTable from '../components/customer-request-rooms-table.component.vue'
import CustomerRequestPetitionsTable from '../components/customer-request-petitions-table.component.vue'

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
  requestDialog.value = true
}

const saveRequest = async (formData) => {
  const payload = {
    ...formData,
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
    const [roomsRes, requestsRes] = await Promise.all([
      axios.get(`${API_URL}/rooms`),
      getCustomerRequests()
    ]);

    rooms.value = roomsRes.data?.map(room => ({
      id: room.id,
      number: room.number,
      type: room.type,
      status: room.status,
      pendingRequests: requestsRes.filter(req =>
          req.roomId === room.id && req.status !== 'Resolved'
      ).length
    })) || [];

    allRequests.value = requestsRes;
    pendingRequests.value = requestsRes.filter(req =>
        req.status && !req.status.includes('Resolved')
    );

  } catch (error) {
    console.error('Error fetching data:', error);
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
      <div class="col-12 md:col-4">
        <CustomerRequestRoomsTable
            v-model:selectedRoom="selectedRoom"
            :rooms="rooms"
            :get-room-requests="getRoomRequests"
            :get-status-severity="getStatusSeverity"
        />
      </div>

      <div class="col-12 md:col-8">
        <CustomerRequestPetitionsTable
            :requests="filteredRequests"
            :staff-members="staffMembers"
            :format-date="formatDate"
            :get-request-severity="getRequestSeverity"
            @assign-staff="assignStaff"
            @resolve-request="resolveRequest"
            @delete-request="deleteRequestById"
        >
          <template #subtitle v-if="selectedRoom">
            Habitación #{{ selectedRoom.number }} - {{ selectedRoom.type }}
          </template>
        </CustomerRequestPetitionsTable>
      </div>
    </div>

    <CustomerRequestFormDialog
        :model-value="requestDialog"
        :rooms="rooms"
        :request-types="requestTypes"
        :priority-options="priorityOptions"
        @update:model-value="(value) => requestDialog = value"
        @update:form="(value) => requestForm = value"
        @submit="saveRequest"
    />
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


</style>