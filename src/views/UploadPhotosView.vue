<template>
  <div class="upload-photos">
    <img src="/icon.jpg" alt="MatchPoint Logo" class="logo" />
    <div class="app-name">MatchPoint</div>

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

const { result, refetch } = useQuery(CURRENT_USER, null, {
  fetchPolicy: 'network-only'
})

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
    letter-spacing: -1px;
  }
  
  h1 {
    margin: 0 0 24px 0;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  
  p {
    color: #666;
    font-size: 14px;
    margin-bottom: 20px;
  }
  
  input[type="file"] {
    padding: 12px;
    font-size: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    margin-bottom: 12px;
  }
  
  input[type="file"]:focus {
    outline: none;
    border-color: #ff7575;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 117, 117, 0.1);
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
    margin: 8px 0;
    width: 100%;
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
  }
  
  .error {
    color: #d32f2f;
    background: #ffebee;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin: 12px 0;
    border-left: 4px solid #d32f2f;
    text-align: left;
  }
  
  .gallery {
    margin-top: 30px;
    text-align: left;
  }
  
  .photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin: 16px 0;
  }
  
  .photo {
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 12px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
  }
  
  .photo img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 4px;
  }
  
  @media (max-width: 480px) {
    .upload-photos {
      margin: 20px;
      padding: 32px 24px;
      border-radius: 12px;
    }
  
    .logo {
      width: 64px;
      height: 64px;
    }
  
    .app-name {
      font-size: 32px;
      margin-bottom: 4px;
    }
  
    h1 {
      font-size: 28px;
      margin-bottom: 20px;
    }
  
    input[type="file"] {
      padding: 10px;
    }
  
    button {
      padding: 12px 20px;
      font-size: 14px;
    }
  }

  input[type="file"] {
  -webkit-appearance: none;
  appearance: none;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box; /* important */
  transition: all 0.2s ease;
}

input[type="file"]:focus {
  outline: none;
  border-color: #ff7575;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 117, 117, 0.1);
}

  </style>