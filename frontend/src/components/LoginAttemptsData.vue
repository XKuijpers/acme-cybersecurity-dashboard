<script setup>
import { ref, onMounted } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(Tooltip, Legend, ArcElement)

const chartData = ref({
  labels: ['Successful', 'Unknown Email ID', 'Wrong Password', 'Account Locked', 'IP Blocked'],
  datasets: [
    {
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#e4e4e4', '#cecece', '#aaaaaa', '#7f7f7f', '#555555'],
      borderColor: '#000000',
      borderWidth: 1,
      hoverOffset: 50,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 30,
  },
  plugins: {
    legend: {
      position: 'right',
    },
  },
}

const loading = ref(true)
const errorMessage = ref('')

async function fetchLoginAttemptStats() {
  try {
    const response = await fetch('https://acme-cybersecurity-backend.vercel.app/api/stats/login-attempts')

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error('Could not load login attempt statistics.')
    }

    const stats = result.data

    chartData.value = {
      ...chartData.value,
      datasets: [
        {
          ...chartData.value.datasets[0],
          data: [
            Number(stats.successful),
            Number(stats.unknown_email),
            Number(stats.wrong_password),
            Number(stats.account_locked),
            Number(stats.ip_blocked),
          ],
        },
      ],
    }
  } catch (error) {
    console.error('Failed to fetch login attempt statistics:', error)
    errorMessage.value = 'Unable to load login attempt statistics.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLoginAttemptStats)
</script>

<template>
  <div class="h-124 mt-5">
    <h2 class="h2 text-center pr-40">Login Attempts</h2>

    <p v-if="loading" class="text-center mt-4">Loading login attempt statistics...</p>

    <p v-else-if="errorMessage" class="text-center mt-4" role="alert">
      {{ errorMessage }}
    </p>

    <!-- Creates the pie chart -->
    <Pie v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
