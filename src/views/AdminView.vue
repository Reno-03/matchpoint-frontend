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
        <div class="stats">
          <div class="stat-card">
            <h3>Total Users</h3>
            <p>{{ stats.totalUsers }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Matches</h3>
            <p>{{ stats.totalMatches }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Swipes</h3>
            <p>{{ stats.totalSwipes }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Messages</h3>
            <p>{{ stats.totalMessages }}</p>
          </div>
        </div>
        
        <!-- Table for the most popular users organized by their likes received and matches -->
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
                <td>
                  <button @click="viewMatches(user.id)" class="view-btn">View Matches</button>
                  <button @click="deleteUser(user.id)" class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal for viewing matches -->
        <div v-if="showMatchesModal" class="modal" @click="closeModal">
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
                
                <button @click="closeModal" class="close-btn">Close</button>
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
    
    /* ---------------- GRAPHQL ---------------- */
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
          matchesCount
        }
      }
    `
    
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
    
    const DELETE_USER = gql`
      mutation DeleteUser($input: DeleteUserInput!) {
        deleteUser(input: $input) {
          success
          errors
        }
      }
    `
    
    const { result, loading, refetch } = useQuery(DASHBOARD_STATS)
    const { mutate: deleteUserMutation } = useMutation(DELETE_USER)
    
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
    
    // Close the modal
    const closeModal = () => {
      showMatchesModal.value = false
      selectedUserId.value = null
      selectedUserName.value = ''
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .logout-btn {
    background: #ff7575;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s ease;
  }
  
  .logout-btn:hover {
    background: #ff4444;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .stat-card {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;
  }
  
  .stat-card h3 {
    margin: 0 0 10px;
    font-size: 14px;
    color: #666;
  }
  
  .stat-card p {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  th {
    background: #f5f5f5;
    font-weight: bold;
  }
  
  .delete-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .popular-users, .users-section {
    margin-top: 40px;
  }

  .view-btn {
    background: #42b983;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;
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
    }

    .modal-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    width: 90%;
    }

    .modal-content h2 {
    margin-bottom: 20px;
    }

    .close-btn {
    margin-top: 20px;
    padding: 10px 20px;
    background: #666;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    }
  </style>