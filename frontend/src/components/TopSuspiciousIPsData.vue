<script setup>
import { ref, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Failed Login Attempts',
      data: [],
      backgroundColor: '#cecece',
      borderColor: '#000000',
      borderWidth: 1,
      hoverBackgroundColor: '#aaaaaa',
      borderRadius: 10,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      beginAtZero: true,
      ticks: {
        // Jumps of 0 decimals
        precision: 0,
      },
    },
    y: {
      grid: {
        display: false,
      },
    },
  },
}

const loading = ref(true)
const errorMessage = ref('')

async function fetchTopSuspiciousIPs() {
  try {
    const response = await fetch('http://localhost:3000/api/stats/top-suspicious-ips')

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Could not load suspicious IP statistics.')
    }

    chartData.value = {
      ...chartData.value,
      labels: result.data.map((item) => item.ip_address),
      datasets: [
        {
          ...chartData.value.datasets[0],
          data: result.data.map((item) => Number(item.total)),
        },
      ],
    }
  } catch (error) {
    console.error('Failed to fetch suspicious IP statistics:', error)
    errorMessage.value = 'Unable to load suspicious IP statistics.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchTopSuspiciousIPs)
</script>

<template>
  <div class="h-65 p-6">
    <h2 class="h2 text-start">Top Suspicious IPs</h2>

    <p v-if="loading" class="mt-2">Loading suspicious IP statistics...</p>

    <p v-else-if="errorMessage" class="mt-2" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="chartData.labels.length === 0" class="mt-2">
      No failed login attempts recorded yet.
    </p>

    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
