<template>
  <div class="upload-photos">
    <h1>Upload Your Photos</h1>
    <p>Upload at least 1 photo to continue (max 5)</p>
    
    <input type="file" accept="image/*" @change="onFileChange" />
    <button @click="uploadPhoto" :disabled="!selectedFile || uploading">
      {{ uploading ? 'Uploading...' : 'Upload Photo' }}
    </button>
    
    <p v-if="error" class="error">{{ error }}</p>
    
    <div v-if="photos.length" class="gallery">
      <h3>Your Photos ({{ photos.length }}/5)</h3>
      <div class="photos">
        <div v-for="photo in photos" :key="photo.id" class="photo">
          <img :src="photo.url" />
          <p v-if="photo.isPrimary">⭐ Primary</p>
        </div>
      </div>
      
      <button @click="goToDeck" :disabled="photos.length === 0">
        Continue to Swipe Deck
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const router = useRouter()

const selectedFile = ref(null)
const uploading = ref(false)
const error = ref(null)

const UPLOAD_PHOTO = gql`
  mutation UploadPhoto($input: UploadPhotoInput!) {
    uploadPhoto(input: $input) {
      photo {
        id
        url
        position
        isPrimary
      }
      errors
    }
  }
`

const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      photos {
        id
        url
        position
        isPrimary
      }
    }
  }
`

const { result, refetch } = useQuery(CURRENT_USER)
const { mutate: uploadPhotoMutation } = useMutation(UPLOAD_PHOTO)

const photos = computed(() => result.value?.currentUser?.photos || [])

const onFileChange = (e) => {
  selectedFile.value = e.target.files[0] || null
}

const uploadPhoto = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  error.value = null

  try {
    const base64 = await fileToBase64(selectedFile.value)
    const isFirstUpload = photos.value.length === 0

    const { data } = await uploadPhotoMutation({
      input: {
        image: base64,
        isPrimary: isFirstUpload
      }
    })

    if (data.uploadPhoto.errors.length) {
      error.value = data.uploadPhoto.errors.join(', ')
    } else {
      refetch()
      selectedFile.value = null
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
    }
  } catch (e) {
    error.value = e.message
  } finally {
    uploading.value = false
  }
}

const fileToBase64 = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })

const goToDeck = () => {
  if (photos.value.length > 0) {
    router.push('/deck')
  }
}
</script>

<style scoped>
.upload-photos {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
}

input {
  padding: 10px;
  font-size: 16px;
  margin: 10px 0;
}

button {
  padding: 12px 20px;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  margin: 10px 5px;
}

button:disabled {
  background: #ccc;
}

.error {
  color: red;
  margin: 10px 0;
}

.gallery {
  margin-top: 30px;
}

.photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.photo {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 8px;
}

.photo img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
}
</style>