<script setup>
import { ref, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Unique Logins',
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
    },
    y: {
      grid: {
        display: false,
      },
      beginAtZero: true,
      ticks: {
        // Jumps without decimals
        precision: 0,
      },
    },
  },
}

const loading = ref(true)
const errorMessage = ref('')

async function fetchUniqueLoginStats() {
  try {
    const response = await fetch('https://acme-cybersecurity-backend.vercel.app/api/stats/unique-logins')
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Could not load unique login statistics.')
    }

    // Store each date's unique IP count
    const counts = new Map()

    result.data.forEach((item) => {
      // Only stores the first 10 characters
      const dateKey = String(item.date).slice(0, 10)
      // Counts the amount of identical date entries
      counts.set(dateKey, Number(item.total))
    })

    // Create labels for today and the previous six days
    const dates = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)

      const dateKey = [
        date.getFullYear(),
        // Adds a 0 in front of singular digits
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      dates.push({
        key: dateKey,
        label: [
          String(date.getDate()).padStart(2, '0'),
          String(date.getMonth() + 1).padStart(2, '0'),
        ].join('-'),
      })
    }

    chartData.value = {
      ...chartData.value,
      labels: dates.map((date) => date.label),
      datasets: [
        {
          ...chartData.value.datasets[0],
          data: dates.map((date) => counts.get(date.key) ?? 0),
        },
      ],
    }
  } catch (error) {
    console.error('Failed to fetch unique login statistics:', error)
    errorMessage.value = 'Unable to load unique login statistics.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUniqueLoginStats)
</script>

<template>
  <div class="h-150">
    <h2 class="h2 text-start ml-8">Unique Logins</h2>

    <p v-if="loading" class="ml-8 mt-2">Loading unique login statistics...</p>

    <p v-else-if="errorMessage" class="ml-8 mt-2" role="alert">
      {{ errorMessage }}
    </p>

    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
