<script setup>
import Settings from '../components/Settings.vue'
import WelcomeSection from '../components/WelcomeSection.vue'
import LoginsData from '../components/LoginsData.vue'
import UniqueLoginsData from '../components/UniqueLoginsData.vue'
import LoginAttemptsData from '../components/LoginAttemptsData.vue'
import TopSuspiciousIPsData from '../components/TopSuspiciousIPsData.vue'
import AttemptsPerCountryData from '../components/AttemptsPerCountryData.vue'
import KeyPerformanceIndicatorData from '../components/KeyPerformanceIndicatorData.vue'
import AlertsSection from '../components/AlertsSection.vue'
</script>

<template>
  <header class="mx-auto max-w-7/8">
    <Settings />
  </header>

  <main class="mx-auto max-w-7/8">
    <WelcomeSection />

    <div class="pt-30 pb-40 text-center grid grid-cols-12 gap-y-67 gap-x-16">
      <div class="col-span-full">
        <AlertsSection />
      </div>

      <div class="col-span-6">
        <LoginsData />
      </div>

      <div class="col-span-6">
        <UniqueLoginsData />
      </div>

      <div class="col-span-6">
        <LoginAttemptsData />
      </div>

      <div class="grid col-span-6 gap-y-4">
        <TopSuspiciousIPsData />
        <AttemptsPerCountryData />
      </div>

      <div class="col-span-full">
        <KeyPerformanceIndicatorData />
      </div>
    </div>
  </main>
</template>
