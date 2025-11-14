// API Helper for Tournament System
// Centralized API calls to Flask backend

// Automatically detect the API base URL
const API_BASE_URL = window.location.origin + '/api';

class TournamentAPI {
    /**
     * Get all tournaments (summary list)
     */
    static async getAllTournaments() {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            throw error;
        }
    }

    /**
     * Get full tournament data by ID
     */
    static async getTournament(tournamentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tournament:', error);
            throw error;
        }
    }

    /**
     * Create a new tournament
     */
    static async createTournament(tournamentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // Include session cookie
                body: JSON.stringify(tournamentData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = 'admin-login.html';
                    throw new Error('Authentication required');
                }
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
    }

    /**
     * Update an existing tournament
     */
    static async updateTournament(tournamentId, tournamentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // Include session cookie
                body: JSON.stringify(tournamentData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = 'admin-login.html';
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating tournament:', error);
            throw error;
        }
    }

    /**
     * Delete a tournament
     */
    static async deleteTournament(tournamentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
                method: 'DELETE',
                credentials: 'include'  // Include session cookie
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = 'admin-login.html';
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error deleting tournament:', error);
            throw error;
        }
    }

    /**
     * Check authentication status
     */
    static async checkAuth() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check`, {
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            console.error('Error checking auth:', error);
            return false;
        }
    }

    /**
     * Logout
     */
    static async logout() {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            sessionStorage.clear();
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    /**
     * Initialize example tournament
     */
    static async initExampleTournament() {
        try {
            const response = await fetch(`${API_BASE_URL}/init-example`, {
                method: 'POST'
            });
            
            if (!response.ok && response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error initializing example tournament:', error);
            throw error;
        }
    }
}

// Make it available globally
window.TournamentAPI = TournamentAPI;
