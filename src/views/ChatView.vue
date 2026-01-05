<template>
  <div class="chat">
    <div class="header">
      <router-link to="/matches">← Back</router-link>
      <h2>{{ otherUserName }}</h2>
    </div>

    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.sender.id === currentUserId ? 'sent' : 'received']"
      >
        <p>{{ msg.content }}</p>
        <span class="time">{{ formatTime(msg.createdAt) }}</span>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="input-form">
      <input 
        v-model="newMessage" 
        placeholder="Type a message..." 
        :disabled="sending"
      />
      <button type="submit" :disabled="!newMessage.trim() || sending">
        Send
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const route = useRoute()
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref(null)
const currentUserId = ref(null)

const matchId = route.params.matchId
const otherUserId = route.query.userId
const otherUserName = route.query.name

/* ---------------- GRAPHQL ---------------- */
const CONVERSATION_MESSAGES = gql`
  query ConversationMessages($matchId: ID!) {
    conversationMessages(matchId: $matchId) {
      id
      content
      sender { id firstName }
      receiver { id firstName }
      read
      createdAt
    }
    currentUser { id }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      message { id content createdAt }
      errors
    }
  }
`

const MARK_AS_READ = gql`
  mutation MarkAsRead($input: MarkAsReadInput!) {
    markAsRead(input: $input) { 
      message { id read } 
      errors 
    }
  }
`

/* ---------------- QUERIES & MUTATIONS ---------------- */
const { result, refetch } = useQuery(
  CONVERSATION_MESSAGES, 
  { matchId },
  { fetchPolicy: 'network-only' }  // ← Always get fresh messages
)

const { mutate: sendMessageMutation } = useMutation(SEND_MESSAGE)
const { mutate: markAsReadMutation } = useMutation(MARK_AS_READ)

const messages = computed(() => result.value?.conversationMessages || [])

/* ---------------- FUNCTIONS ---------------- */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  sending.value = true

  try {
    const { data } = await sendMessageMutation({
      input: {
        matchId: matchId,
        receiverId: otherUserId,
        content: newMessage.value
      }
    })

    if (!data.sendMessage.errors.length) {
      newMessage.value = ''
      await refetch()
      scrollToBottom()
    }
  } catch (e) {
    console.error('Send error:', e)
  } finally {
    sending.value = false
  }
}

const markUnreadMessages = async () => {
  if (!currentUserId.value) return
  
  const unreadMessages = messages.value.filter(
    msg => !msg.read && msg.receiver.id === currentUserId.value
  )

  for (const msg of unreadMessages) {
    try {
      await markAsReadMutation({ input: { messageId: msg.id } })
    } catch (e) {
      console.error('Mark as read error:', e)
    }
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/* ---------------- LIFECYCLE ---------------- */
// Set current user ID when data loads
watch(result, (val) => {
  if (val?.currentUser) {
    currentUserId.value = val.currentUser.id
    markUnreadMessages()
    scrollToBottom()
  }
})

// Initial load
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat {
  max-width: 600px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 12px;
}

.sent {
  align-self: flex-end;
  background: #42b983;
  color: white;
}

.received {
  align-self: flex-start;
  background: #f0f0f0;
}

.time {
  font-size: 11px;
  opacity: 0.7;
}

.input-form {
  display: flex;
  padding: 15px;
  border-top: 1px solid #ddd;
  gap: 10px;
}

.input-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
}

.input-form button {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.input-form button:disabled {
  background: #ccc;
}
</style>
