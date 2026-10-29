<script setup>
import { ref, onMounted } from 'vue'

const kpi = ref({
  successfulLogins: 0,
  uniqueIPs: 0,
  failedPercentage: 0,
})

const loading = ref(true)
const error = ref(false)

// Formats the number to Dutch conventions (commas and periods)
const formatNumber = (number) => new Intl.NumberFormat('nl-NL').format(number)

onMounted(async () => {
  try {
    const response = await fetch('https://acme-cybersecurity-backend.vercel.app/api/stats/kpi')
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Failed to fetch KPI statistics')
    }

    kpi.value = result.data
  } catch (err) {
    console.error('Failed to load KPIs:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="grid grid-cols-12 h-77 gap-x-16 gap-y-10">
    <div class="col-span-full">
      <h2 class="h2">Key Performance Indicator</h2>
    </div>

    <h3 class="h3 col-span-4">Logins</h3>
    <h3 class="h3 col-span-4">Unique Logins</h3>
    <h3 class="h3 col-span-4">Failed Logins</h3>

    <div class="col-span-4 bg-secondary h-45 -mt-6 shadow-box-large rounded-[15px]">
      <p class="flex justify-center items-center h-full h3">
        {{ loading ? '...' : error ? '—' : formatNumber(kpi.successfulLogins) }}
      </p>
    </div>

    <div class="col-span-4 bg-secondary h-45 -mt-6 shadow-box-large rounded-[15px]">
      <p class="flex justify-center items-center h-full h3">
        {{ loading ? '...' : error ? '—' : formatNumber(kpi.uniqueIPs) }}
      </p>
    </div>

    <div class="col-span-4 bg-secondary h-45 -mt-6 shadow-box-large rounded-[15px]">
      <p class="flex justify-center items-center h-full h3">
        <!-- Fixes the percentage to 2 decimals -->
        {{ loading ? '...' : error ? '—' : `${kpi.failedPercentage.toFixed(2)}%` }}
      </p>
    </div>
  </div>
</template>
