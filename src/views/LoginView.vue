<template>
  <div class="login">
    <h1>Login</h1>
    
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
      
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const router = useRouter()

const email = ref('maria@test.com')
const password = ref('password123')
const error = ref(null)

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      token
      user { id firstName }
      errors
    }
  }
`

const { mutate: loginUser, loading } = useMutation(LOGIN_USER)

const handleLogin = async () => {
  error.value = null
  
  try {
    const { data } = await loginUser({
      input: {
        email: email.value,
        password: password.value
      }
    })
    
    if (data.loginUser.errors.length) {
      error.value = data.loginUser.errors.join(', ')
    } else {
      localStorage.setItem('token', data.loginUser.token)
      router.push('/deck')
    }
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input {
  padding: 10px;
  font-size: 16px;
}

button {
  padding: 12px;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background: #ccc;
}

.error {
  color: red;
}
</style>