<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

const settingsClicked = ref(false)

function openSettings() {
  settingsClicked.value = !settingsClicked.value
}

function logOff() {
  sessionStorage.setItem('loggedIn', 'false')
  router.push('/')
}
</script>

<template>
  <div class="fixed right-[6.25%] top-8 z-999">
    <font-awesome-icon
      icon="cog"
      class="h2 hover:cursor-pointer hover:rotate-45 transition-transform"
      @click="openSettings"
    />
    <div
      v-if="settingsClicked"
      class="absolute right-0 py-1 w-30 bg-secondary text-center mt-2 rounded-[4px] shadow-box-small"
    >
      <p
        class="group text-body hover:cursor-pointer hover:font-bold hover:text-custom-red transition-transform"
        @click="logOff"
      >
        <font-awesome-icon class="!hidden group-hover:!inline-block" icon="sign-out" />
        Log off
      </p>
    </div>
  </div>
</template>
