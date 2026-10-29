<script setup>
import { ref, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Login Attempts',
      data: [],
      backgroundColor: '#cecece',
      hoverBackgroundColor: '#aaaaaa',
      borderColor: '#000000',
      borderWidth: 1,
      borderRadius: 10,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  // Turns the chart sideways
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
        // Increment steps, no decimals
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

async function fetchAttemptsPerCountry() {
  try {
    const response = await fetch('http://localhost:3000/api/stats/attempts-per-country')

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Could not load country statistics.')
    }

    chartData.value = {
      ...chartData.value,
      labels: result.data.map((item) => item.country),
      datasets: [
        {
          ...chartData.value.datasets[0],
          data: result.data.map((item) => Number(item.total)),
        },
      ],
    }
  } catch (error) {
    console.error('Failed to fetch country statistics:', error)
    errorMessage.value = 'Unable to load country statistics.'
  } finally {
    loading.value = false
  }
}

// Runs when component loads into the DOM
onMounted(fetchAttemptsPerCountry)
</script>

<template>
  <div class="h-65 p-6">
    <h2 class="h2 text-start">Attempts Per Country</h2>

    <p v-if="loading" class="mt-2">Loading country statistics...</p>

    <p v-else-if="errorMessage" class="mt-2" role="alert">
      {{ errorMessage }}
    </p>

    <p v-else-if="chartData.labels.length === 0" class="mt-2">
      No login attempts with a known country have been recorded yet.
    </p>

    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
