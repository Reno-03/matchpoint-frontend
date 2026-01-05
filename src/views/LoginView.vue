<template>
  <div class="login">
    <img src="/icon.jpg" alt="MatchPoint Logo" class="logo" />
    <div class="app-name">MatchPoint</div>
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
  max-width: 420px;
  margin: 60px auto;
  padding: 40px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: block;
  border-radius: 12px;
  object-fit: contain;
}

.app-name {
  font-size: 36px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
}

h1 {
  margin: 0 0 32px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  letter-spacing: -0.5px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

input {
  padding: 14px 16px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.2s ease;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: #ff7575;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 117, 117, 0.1);
}

input::placeholder {
  color: #9e9e9e;
}

button {
  padding: 14px 24px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(246, 72, 59, 0.3);
}

button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7575 0%, #ea580c 100%);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(246, 72, 59, 0.3);
}

button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin: 0;
  border-left: 4px solid #d32f2f;
}

.login > p {
  margin-top: 24px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login > p a {
  color: #ff7575;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login > p a:hover {
  color: #f97316;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login {
    margin: 20px;
    padding: 32px 24px;
    border-radius: 12px;
  }

  .logo {
    width: 64px;
    height: 64px;
    margin-bottom: 12px;
  }

  .app-name {
    font-size: 32px;
    margin-bottom: 4px;
  }

  h1 {
    font-size: 28px;
    margin-bottom: 24px;
  }

  form {
    gap: 16px;
  }
}
</style>