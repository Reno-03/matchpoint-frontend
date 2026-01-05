<template>
  <div class="register">
    <h1>Create Account</h1>
    
    <form @submit.prevent="handleRegister">
      <input v-model="form.firstName" placeholder="First Name" required />
      <input v-model="form.lastName" placeholder="Last Name" required />
      <input v-model="form.email" type="email" placeholder="Email" required />
      <input v-model="form.password" type="password" placeholder="Password" required />
      
      <input v-model="form.birthdate" type="date" required />
      
      <select v-model="form.gender" required>
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      
      <select v-model="form.genderInterest" required>
        <option value="">Interested in</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Both">Both</option>
      </select>
      
      <input v-model="form.country" placeholder="Country" required />
      <input v-model="form.city" placeholder="City" required />
      <textarea v-model="form.bio" placeholder="Bio (optional)"></textarea>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Register' }}
      </button>
      
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    
    <p>Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const router = useRouter()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  birthdate: '',
  gender: '',
  genderInterest: '',
  country: 'Philippines',
  city: '',
  bio: ''
})

const error = ref(null)

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
      user { id firstName }
      errors
    }
  }
`

const { mutate: registerUser, loading } = useMutation(REGISTER_USER)

const handleRegister = async () => {
  error.value = null
  
  try {
    const { data } = await registerUser({
      input: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        password: form.value.password,
        birthdate: form.value.birthdate,
        gender: form.value.gender,
        genderInterest: form.value.genderInterest,
        country: form.value.country,
        city: form.value.city,
        bio: form.value.bio
      }
    })
    
    if (data.registerUser.errors.length) {
      error.value = data.registerUser.errors.join(', ')
    } else {
      localStorage.setItem('token', data.registerUser.token)
      if (data.registerUser.errors.length) {
        error.value = data.registerUser.errors.join(', ')
      } else {
        localStorage.setItem('token', data.registerUser.token)
        router.push('/upload-photos')  // ← Changed from '/deck'
      }
    }
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input, select, textarea {
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