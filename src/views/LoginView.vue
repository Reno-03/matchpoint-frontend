<template>
  <div class="login">
    <!-- Logo -->
    <img src="/icon.jpg" alt="MatchPoint Logo" class="logo" />
    <div class="app-name">MatchPoint</div>
    <h1>Login</h1>

    <!-- Form -->
    <form @submit.prevent="handleLogin">
      <!-- Email input -->
      <input v-model="email" type="email" placeholder="Email" required />

      <!-- Password input with Lucide eye toggle -->
      <div class="password-wrapper">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          required
        />
        <span class="eye-icon" @click="showPassword = !showPassword">
          <component :is="showPassword ? Eye : EyeOff" size="18" />
        </span>
      </div>

      <!-- Submit button -->
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <!-- Error message -->
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <!-- Register link -->
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

// Lucide icons
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref(null)

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      token
      user { id firstName role }
      errors
    }
  }
`

const { mutate: loginUser, loading } = useMutation(LOGIN_USER)

const handleLogin = async () => {
  error.value = null

  try {
    const { data } = await loginUser({
      input: { email: email.value, password: password.value }
    })

    if (data.loginUser.errors.length) {
      error.value = data.loginUser.errors.join(', ')
    } else {
      localStorage.setItem('token', data.loginUser.token)
      const userRole = data.loginUser.user?.role
      if (userRole === 'admin') {
        router.push('/admin')
      } else {
        const redirect = route.query.redirect || '/deck'
        router.push(redirect)
      }
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: center;
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
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

h1 {
  margin: 0 0 32px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding-right: 40px; /* space for icon */
  box-sizing: border-box;
}

.eye-icon {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
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
}

button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
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
  font-size: 14px;
  color: #666;
}

.login > p a {
  color: #ff7575;
  text-decoration: none;
  font-weight: 600;
}

.login > p a:hover {
  color: #f97316;
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
