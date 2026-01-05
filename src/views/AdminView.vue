<template>
  <div class="admin">
    <div class="header">
      <h1>MatchPoint Admin Dashboard</h1>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    
    
    <!-- Loading -->
    <div v-if="loading">Loading...</div>

    <!-- Dashboard for the admin with the stats, popular users, and all users -->
    <div v-else-if="stats" class="dashboard">
      <section class="overview">
        <div class="stats">
          <div class="stat-card users">
            <h3>Total Users</h3>
            <p class="stat-value">{{ stats.totalUsers }}</p>
            <span class="stat-meta">Registered accounts</span>
          </div>

          <div class="stat-card matches">
            <h3>Total Matches</h3>
            <p class="stat-value">{{ stats.totalMatches }}</p>
            <span class="stat-meta">Successful matches</span>
          </div>

          <div class="stat-card swipes">
            <h3>Total Swipes</h3>
            <p class="stat-value">{{ stats.totalSwipes }}</p>
            <span class="stat-meta">User interactions</span>
          </div>

          <div class="stat-card messages">
            <h3>Total Messages</h3>
            <p class="stat-value">{{ stats.totalMessages }}</p>
            <span class="stat-meta">Messages sent</span>
          </div>
        </div>
      </section>

      <!-- Table for the most popular users organized by their likes received and matches -->
      <section class="data-section">
        <div class="popular-users">
          <h2>Most Popular Users</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Likes Received</th>
                <th>Matches</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.popularUsers" :key="item.user.id">
                <td>{{ item.user.firstName }}</td>
                <td>{{ item.likesReceived }}</td>
                <td>{{ item.matchesCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table for all users with their matches and actions -->
        <div class="users-section">
          <h2>All Users</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Matches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.city }}</td>
                <td>{{ user.matchesCount }}</td>
                <td class="actions">
                  <button @click="viewMatches(user.id)" class="view-btn">View</button>
                  <button @click="openUpdateModal(user)" class="update-btn">Edit</button>
                  <button @click="deleteUser(user.id)" class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal for viewing matches -->
      <div v-if="showMatchesModal" class="modal" @click="closeMatchesModal">
        <div class="modal-content" @click.stop>
          <h2>Matches for {{ selectedUserName }}</h2>

          <div v-if="loadingMatches">Loading...</div>

          <div v-else-if="userMatches.length === 0">
            <p>No matches yet</p>
          </div>

          <table v-else>
            <thead>
              <tr>
                <th>Matched With</th>
                <th>Email</th>
                <th>City</th>
                <th>Date Matched</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in userMatches" :key="match.id">
                <td>{{ getOtherUser(match).firstName }} {{ getOtherUser(match).lastName }}</td>
                <td>{{ getOtherUser(match).email }}</td>
                <td>{{ getOtherUser(match).city }}</td>
                <td>{{ formatDate(match.createdAt) }}</td>
              </tr>
            </tbody>
          </table>

          <button @click="closeMatchesModal" class="close-btn">Close</button>
        </div>
      </div>

      <!-- Modal for updating user information -->
      <div v-if="showUpdateModal" class="modal" @click="closeUpdateModal">
        <div class="modal-content" @click.stop>
          <h2>Update User: {{ updateForm.firstName }} {{ updateForm.lastName }}</h2>

          <form @submit.prevent="updateUser" class="update-form">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="updateForm.firstName" type="text" required />
            </div>

            <div class="form-group">
              <label>Last Name</label>
              <input v-model="updateForm.lastName" type="text" required />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input v-model="updateForm.email" type="email" required />
            </div>

            <div class="form-group">
              <label>City</label>
              <input v-model="updateForm.city" type="text" required />
            </div>

            <div class="form-group">
              <label>Bio</label>
              <textarea v-model="updateForm.bio" rows="4"></textarea>
            </div>

            <div class="form-group">
              <label>Mobile</label>
              <input v-model="updateForm.mobile" type="text" placeholder="09123456789" />
            </div>

            <div class="form-group">
              <label>School</label>
              <input v-model="updateForm.school" type="text" placeholder="Optional" />
            </div>

            <div class="form-group">
              <label>Sexual Orientation</label>
              <select v-model="updateForm.sexualOrientation">
                <option value="" disabled hidden>Select</option>
                <option value="Straight">Straight</option>
                <option value="Bisexual">Bisexual</option>
                <option value="Gay">Gay</option>
                <option value="Other">Other</option>
              </select>
            </div>


            <div v-if="updateError" class="error-message">
              {{ updateError }}
            </div>

            <div class="form-actions">
              <button type="submit" :disabled="updating" class="save-btn">
                {{ updating ? 'Updating...' : 'Save Changes' }}
              </button>
              <button type="button" @click="closeUpdateModal" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useLazyQuery } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

// initialize the router
const router = useRouter()

const showMatchesModal = ref(false)
const selectedUserId = ref(null)
const selectedUserName = ref('')

const showUpdateModal = ref(false)
const updating = ref(false)
const updateError = ref(null)
const updateForm = ref({
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  city: '',
  bio: '',
  mobile: '',
  school: '',
  sexualOrientation: ''
})

/* ---------------- GRAPHQL ---------------- */

// Query for the dashboard stats
const DASHBOARD_STATS = gql`
      query DashboardStats {
        dashboardStats(popularLimit: 10) {
          totalUsers
          totalMatches
          totalSwipes
          totalMessages
          popularUsers {
            user { id firstName }
            likesReceived
            matchesCount
          }
        }
        allUsers(limit: 50) {
          id
          firstName
          lastName
          email
          city
          bio
          mobile
          school
          sexualOrientation
          matchesCount
        }
      }
    `

// Query for the user matches
const USER_MATCHES = gql`
      query UserMatches($userId: ID!) {
        userMatches(userId: $userId) {
          id
          user1 { id firstName lastName email city }
          user2 { id firstName lastName email city }
          createdAt
        }
      }
    `

// Query for the user details
const USER_DETAILS = gql`
      query UserDetails($userId: ID!) {
        user(userId: $userId) {
          id
          firstName
          lastName
          email
          city
          bio
        }
      }
    `

// Mutation for updating a user
const UPDATE_USER = gql`
      mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
          user {
            id
            firstName
            lastName
            email
            city
            bio
          }
          errors
        }
      }
    `

// Mutation for deleting a user
const DELETE_USER = gql`
      mutation DeleteUser($input: DeleteUserInput!) {
        deleteUser(input: $input) {
          success
          errors
        }
      }
    `

const { result, loading, refetch } = useQuery(DASHBOARD_STATS, null, {
  fetchPolicy: 'network-only'
})

const { mutate: deleteUserMutation } = useMutation(DELETE_USER)
const { mutate: updateUserMutation } = useMutation(UPDATE_USER)

// Lazy query for user matches - only runs when called
const {
  result: matchesResult,
  loading: loadingMatches,
  load: loadUserMatches
} = useLazyQuery(USER_MATCHES)

// Computed properties, returns the data from the query
const stats = computed(() => result.value?.dashboardStats)
const users = computed(() => result.value?.allUsers || [])
const userMatches = computed(() => matchesResult.value?.userMatches || [])

// View matches for a user using the lazy query
const viewMatches = async (userId) => {
  const user = users.value.find(u => u.id === userId)
  selectedUserId.value = userId
  selectedUserName.value = `${user.firstName} ${user.lastName}`
  showMatchesModal.value = true

  // Load matches for this user
  await loadUserMatches(USER_MATCHES, { userId })
}

// Get the other user from a match
const getOtherUser = (match) => {
  return match.user1.id === selectedUserId.value ? match.user2 : match.user1
}

// Close the matches modal
const closeMatchesModal = () => {
  showMatchesModal.value = false
  selectedUserId.value = null
  selectedUserName.value = ''
}

// Open update modal and load user details
// use allUsers query to get the user details
const openUpdateModal = async (user) => {
  updateForm.value = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    city: user.city,
    bio: user.bio || '',
    mobile: user.mobile || '',
    school: user.school || '',
    sexualOrientation: user.sexualOrientation || ''
  }
  showUpdateModal.value = true
  updateError.value = null
}

// Close update modal
const closeUpdateModal = () => {
  showUpdateModal.value = false
  updateForm.value = {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    bio: ''
  }
  updateError.value = null
}

// Update user information
const updateUser = async () => {
  updating.value = true
  updateError.value = null

  // Optional frontend mobile validation
  if (updateForm.value.mobile && !/^\+?\d{10,15}$/.test(updateForm.value.mobile)) {
    updateError.value = "Mobile number must be 10-15 digits"
    updating.value = false
    return
  }

  try {
    const { data } = await updateUserMutation({
      input: {
        userId: updateForm.value.id,
        firstName: updateForm.value.firstName,
        lastName: updateForm.value.lastName,
        email: updateForm.value.email,
        city: updateForm.value.city,
        bio: updateForm.value.bio,
        mobile: updateForm.value.mobile,
        school: updateForm.value.school,
        sexualOrientation: updateForm.value.sexualOrientation
      }
    })

    if (data?.updateUser?.errors?.length) {
      updateError.value = data.updateUser.errors.join(', ')
    } else {
      // Success - refresh the user list and close modal
      await refetch()
      closeUpdateModal()
    }
  } catch (e) {
    updateError.value = e.message || 'Error updating user'
  } finally {
    updating.value = false
  }
}

// Format the date
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Delete a user by id using the deleteUserMutation
const deleteUser = async (userId) => {
  if (!confirm('Are you sure?')) return

  try {
    await deleteUserMutation({ input: { userId } })
    refetch()
  } catch (e) {
    alert('Error deleting user: ' + e.message)
  }
}

// Logout the user by removing the token from localStorage and redirecting to the login page
const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.admin {
  max-width: 1400px;
  margin: 40px auto;
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 24px;
  background: #fcf5ef;
  border: 1px solid #f974163e;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(10, 3, 3, 0.08);
}

.header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.logout-btn {
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(246, 72, 59, 0.3);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #ff7575 0%, #ea580c 100%);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
  transform: translateY(-1px);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #eee;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  text-align: left;
}

.stat-card h3 {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
}

.stat-meta {
  font-size: 13px;
  color: #9ca3af;
}

.stat-card p {
  margin: 0;
  font-size: 62px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.popular-users,
.users-section {
  margin-top: 40px;
  background: #fcf5ef;
  border: 1px solid #f974163e;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.popular-users h2,
.users-section h2 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 2px solid #f5f5f5;
}

th {
  background: #fcf5ef;
  font-weight: 700;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  transition: background 0.2s ease;
}

tbody tr:hover {
  background: #f1e0db;
}

.actions {
  white-space: nowrap;
}

.view-btn,
.update-btn,
.delete-btn {
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  margin-right: 6px;
  transition: all 0.2s ease;
}

.view-btn {
  background: linear-gradient(135deg, #42b983 0%, #2c8a5f 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(66, 185, 131, 0.3);
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(66, 185, 131, 0.4);
}

.update-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.update-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

.delete-btn {
  background: transparent;
  color: #dc2626;
  box-shadow: none;
}

.delete-btn:hover {
  background: #fee2e2;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  margin-top: 24px;
  padding: 12px 24px;
  background: #666;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #555;
  transform: translateY(-1px);
}

.update-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: #fafafa;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ffaa75;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 117, 117, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  padding: 14px 16px;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 8px;
  border-left: 4px solid #d32f2f;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.save-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.save-btn:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.cancel-btn {
  padding: 12px 24px;
  background: #666;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #555;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .admin {
    padding: 20px;
    margin: 20px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-card p {
    font-size: 28px;
  }

  table {
    font-size: 14px;
  }

  th,
  td {
    padding: 12px 8px;
  }

  .view-btn,
  .update-btn,
  .delete-btn {
    padding: 6px 12px;
    font-size: 12px;
    margin: 2px;
  }
}

.overview {
  margin-bottom: 48px;
}

.data-section {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
</style>