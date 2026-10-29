<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')

const errorMessage = ref('')

const login = async () => {
  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  })

  const data = await response.json()

  console.log(data)

  if (data.success) {
    sessionStorage.setItem('loggedIn', 'true')
    router.push('/monitor')
  } else {
    errorMessage.value = data.message
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen items-center justify-center">
    <h1 class="h1">ACME Corporation</h1>

    <div
      class="flex flex-col px-13 bg-secondary w-full h-105 mt-16 rounded-[30px] shadow-box-large text-center"
    >
      <h2 class="h2 pt-6">User Login</h2>

      <div class="flex flex-col gap-10 pt-12">
        <div class="flex gap-6 items-center text-left w-full border-b-3">
          <font-awesome-icon icon="envelope" class="h3" />
          <input
            v-model="email"
            class="outline-none w-full text-body placeholder-black/60"
            type="text"
            placeholder="Email ID"
          />
        </div>

        <div class="flex gap-6 items-center text-left w-full border-b-3">
          <font-awesome-icon icon="lock" class="h3 mb-1" />
          <input
            v-model="password"
            class="outline-none w-full text-body placeholder-black/60"
            type="password"
            placeholder="Password"
          />
        </div>
      </div>

      <div v-if="errorMessage" class="mt-2">
        <p class="text-custom-red font-bold">{{ errorMessage }}</p>
      </div>

      <div class="flex justify-center mt-auto pb-8">
        <button
          @click="login"
          class="hover:cursor-pointer hover:bg-primary-hover hover:border-0 border-b-3 h3 bg-primary w-4/5 py-1 rounded-[10px] hover:border-t-3 hover:border-x-1"
        >
          Login
        </button>
      </div>
    </div>
  </div>
</template>
