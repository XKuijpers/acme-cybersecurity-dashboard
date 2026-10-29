<script setup>
import { ref, computed, onMounted } from 'vue'

const alerts = ref([])
const loading = ref(true)
const error = ref(false)

// Uses custom tailwind colors tied to priority
const priorities = [
  { name: 'Low', class: 'bg-low-priority' },
  { name: 'Medium', class: 'bg-medium-priority' },
  { name: 'High', class: 'bg-high-priority' },
  { name: 'Urgent', class: 'bg-urgent-priority' },
]

const groupedAlerts = computed(() =>
  priorities.map((priority) => ({
    ...priority,
    alerts: alerts.value.filter(
      (alert) => alert.severity?.toLowerCase() === priority.name.toLowerCase(),
    ),
  })),
)

function formatDate(dateString) {
  const date = new Date(dateString)

  // Adds 0 in front of the number if it's a single digit
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month} | ${hours}:${minutes}`
}

async function markAsRead(alert) {
  try {
    const response = await fetch(`https://acme-cybersecurity-backend.vercel.app/api/alerts/${alert.id}/read`, {
      method: 'PATCH',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Failed to mark alert as read')
    }

    // Remove the alert from this column
    alerts.value = alerts.value.filter((item) => item.id !== alert.id)
  } catch (err) {
    console.error('Failed to mark alert as read:', err)
  }
}

// Runs when component is fully loaded in DOM
onMounted(async () => {
  try {
    const response = await fetch('https://acme-cybersecurity-backend.vercel.app/api/alerts')

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Failed to fetch alerts')
    }

    alerts.value = result.data
  } catch (err) {
    console.error('Failed to load alerts:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="grid grid-cols-12 gap-x-16 gap-y-10">
    <div class="col-span-full">
      <h2 class="h2">Alerts</h2>
    </div>

    <div
      v-for="priority in groupedAlerts"
      :key="priority.name"
      class="col-span-3 flex flex-col gap-y-8"
    >
      <h3 class="h3 text-left">
        {{ priority.name }}
      </h3>

      <p v-if="loading" class="text-body -mt-6">Loading alerts...</p>

      <p v-else-if="error" class="text-body -mt-6">Could not load alerts.</p>

      <p v-else-if="priority.alerts.length === 0" class="text-body -mt-6">No alerts</p>

      <div
        v-for="alert in priority.alerts"
        :key="alert.id"
        :class="[
          'col-span-3 -mt-6 group shadow-box-small rounded-[5px] hover:bg-custom-red hover:scale-105 hover:shadow-box-small-hover transition-transform cursor-pointer',
          priority.class,
        ]"
        @click="markAsRead(alert)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-body font-bold text-white px-2 py-1">
              {{ alert.description }}
            </p>

            <p class="text-caption text-white px-2 pb-2">
              {{ formatDate(alert.created_at) }}
            </p>
          </div>

          <button
            type="button"
            class="!hidden group-hover:!inline-block pt-1 pr-2 text-white hover:cursor-pointer"
            @click="markAsRead(alert)"
          >
            <font-awesome-icon icon="trash-can" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
