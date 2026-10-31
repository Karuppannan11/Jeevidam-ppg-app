// api/api.js - Complete API module for PPG-FPO Management System

import axios from 'axios';

// ─── API Configuration ──────────────────────────────────────────
// For Android Emulator
const API_BASE_URL = 'http://localhost:5030';

// For iOS Simulator
// const API_BASE_URL = 'http://localhost:5000';

// For Physical Device (replace with your computer's local IP)
// const API_BASE_URL = 'http://192.168.1.100:5000';

// ─── Location APIs ──────────────────────────────────────────────

// Fetch all states
export const fetchStates = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/state`);
    return response.data;
  } catch (error) {
    console.error('Error fetching states:', error);
    throw error.response?.data || error;
  }
};

// Fetch districts by state
export const fetchDistricts = async (state_scode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/district`, {
      params: { state_scode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error.response?.data || error;
  }
};

// Fetch locations by district
export const fetchLocations = async (district_dcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/location`, {
      params: { district_dcode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error.response?.data || error;
  }
};

// Fetch clusters by location
export const fetchClusters = async (location_lcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cluster`, {
      params: { location_lcode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clusters:', error);
    throw error.response?.data || error;
  }
};

// Fetch groups by cluster
export const fetchGroups = async (cluster_ccode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/grp`, {
      params: { cluster_ccode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error.response?.data || error;
  }
};

// Fetch members by group
export const fetchMembers = async (group_gcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/members`, {
      params: { group_gcode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error.response?.data || error;
  }
};

// ─── PPG APIs ────────────────────────────────────────────────────

// Fetch PPG list with member counts
export const fetchPPGList = async (cluster_ccode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/list-for-original`, {
      params: { cluster_ccode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG list:', error);
    throw error.response?.data || error;
  }
};

// Alias for PPGOriginal screen compatibility
export const fetchPPGListForOriginal = fetchPPGList;

// Fetch simple PPG list (id, code, name only)
export const fetchPPGListSimple = async (cluster_ccode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/list-simple`, {
      params: { cluster_ccode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching simple PPG list:', error);
    throw error.response?.data || error;
  }
};

// Fetch all PPGs (no filter)
export const fetchAllPPGs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all PPGs:', error);
    throw error.response?.data || error;
  }
};

// Fetch PPG name tables
export const fetchPPGNameTables = async (cluster_ccode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/names`, {
      params: { cluster_ccode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG name tables:', error);
    throw error.response?.data || error;
  }
};

// Fetch all PPG name tables
export const fetchAllPPGNameTables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/names/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all PPG name tables:', error);
    throw error.response?.data || error;
  }
};

// Create new PPG (Simple - just name and cluster)
export const createPPGSimple = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ppg/create-simple`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating PPG (simple):', error);
    throw error.response?.data || error;
  }
};

// Create new PPG (Original - full details including bank info)
export const createPPGOriginal = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ppg/original`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating PPG:', error);
    throw error.response?.data || error;
  }
};

// Save PPG members
export const createPPGMembers = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ppg/members`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving PPG members:', error);
    throw error.response?.data || error;
  }
};

// Fetch PPG members from table
export const fetchPPGMembersFromTable = async (ppg_id, group_gcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/members/table`, {
      params: { ppg_id, group_gcode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG members:', error);
    throw error.response?.data || error;
  }
};

// ─── PPG Name Table APIs ────────────────────────────────────────

// Fetch PPG name list by cluster
export const fetchPPGNameList = async (cluster_ccode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppgname/list`, {
      params: { cluster_ccode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG name list:', error);
    throw error.response?.data || error;
  }
};

// Fetch PPG groups by PPG code
export const fetchPPGNameGroups = async (ppg_code) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppgname/groups`, {
      params: { ppg_code }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG groups:', error);
    throw error.response?.data || error;
  }
};


// api/api.js - Add this function for ProductManagementScreen

// Fetch all PPGs for products (with proper ID mapping)
export const fetchAllPPGsForProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/all`);
    // Ensure each PPG has an 'id' field
    return response.data.map(p => ({
      ...p,
      id: p.id || p.ppg_id // Ensure ID is present
    }));
  } catch (error) {
    console.error('Error fetching all PPGs for products:', error);
    throw error.response?.data || error;
  }
};
// api/api.js - Updated fetchPPGProducts

export const fetchPPGProducts = async (ppgId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/ppg/${ppgId}`);
    console.log(`📦 Products for PPG ${ppgId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG products:', error);
    throw error.response?.data || error;
  }
};

// api/api.js - Updated createPPGProduct
export const createPPGProduct = async (ppg_id, product_name, unit_id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/products`, {
      ppg_id: parseInt(ppg_id),
      product_name: product_name.trim(),
      unit_id: parseInt(unit_id)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating PPG product:', error);
    if (error.response) {
      throw error.response.data;
    }
    throw { error: error.message };
  }
};
export const fetchPPGMembersMode = async (ppgId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/${ppgId}/members-mode`);
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG members mode:', error);
    throw error.response?.data || error;
  }
};
// api/api.js - Add this function for PPGMeetingScreen

// Create PPG Meeting
export const createPPGMeeting = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ppg/meeting`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating PPG meeting:', error);
    throw error.response?.data || error;
  }
};

// Fetch PPG members by PPG code and group
export const fetchPPGNameMembers = async (ppg_code, group_gcode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppgname/members`, {
      params: { ppg_code, group_gcode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG name members:', error);
    throw error.response?.data || error;
  }
};

// ─── FPO APIs ────────────────────────────────────────────────────

// Generate FPO code
export const generateFPOCode = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/fpo/generate-code`);
    return response.data;
  } catch (error) {
    console.error('Error generating FPO code:', error);
    throw error.response?.data || error;
  }
};

// Create new FPO
export const createFPO = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/fpo/original`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating FPO:', error);
    throw error.response?.data || error;
  }
};

// Save FPO members
export const createFPOMembers = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/fpo/members`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving FPO members:', error);
    throw error.response?.data || error;
  }
};

// ─── FPO Demand APIs ────────────────────────────────────────────

// Create FPO demand
export const createFPODemand = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/fpo/demand`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating FPO demand:', error);
    throw error.response?.data || error;
  }
};

// Fetch FPO demands
export const fetchFPODemands = async (fpo_id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/fpo/demands`, {
      params: { fpo_id }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching FPO demands:', error);
    throw error.response?.data || error;
  }
};

// ─── Unit APIs ──────────────────────────────────────────────────

// Fetch all units
export const fetchUnits = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/units`);
    return response.data;
  } catch (error) {
    console.error('Error fetching units:', error);
    throw error.response?.data || error;
  }
};

// Create new unit
export const createUnit = async (unit_name) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/units`, { unit_name });
    return response.data;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error.response?.data || error;
  }
};

// ─── Product APIs ──────────────────────────────────────────────

// Fetch all products
export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error.response?.data || error;
  }
};

// Fetch products by PPG ID
export const fetchProductsByPPG = async (ppgId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/ppg/${ppgId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products by PPG:', error);
    throw error.response?.data || error;
  }
};

// Create new product
export const createProduct = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/products`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error.response?.data || error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error.response?.data || error;
  }
};

// ─── PPG Meeting APIs ───────────────────────────────────────────

// Save PPG meeting with all details
export const savePPGMeeting = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ppg/meeting`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving PPG meeting:', error);
    throw error.response?.data || error;
  }
};

// Fetch PPG meetings
export const fetchPPGMeetings = async (ppg_id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppg/meetings`, {
      params: { ppg_id }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PPG meetings:', error);
    throw error.response?.data || error;
  }
};

// Fetch meeting by ID
export const fetchMeetingById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/meeting/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error.response?.data || error;
  }
};

// ─── Test APIs ──────────────────────────────────────────────────

// Test database connection
export const testDBConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/test`);
    return response.data;
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error.response?.data || error;
  }
};

// Test PPG members
export const testPPGMembers = async (ppgId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/test/ppg-members/${ppgId}`);
    return response.data;
  } catch (error) {
    console.error('Error testing PPG members:', error);
    throw error.response?.data || error;
  }
};

// Test all PPG members
export const testAllPPGMembers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/test/ppg-members-all`);
    return response.data;
  } catch (error) {
    console.error('Error testing all PPG members:', error);
    throw error.response?.data || error;
  }
};

// ─── Utility function to handle API errors ─────────────────────

export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data?.error || error.response.data?.message || 'Server error';
    return { success: false, error: message };
  } else if (error.request) {
    // The request was made but no response was received
    return { success: false, error: 'No response from server. Check your connection.' };
  } else {
    // Something happened in setting up the request that triggered an Error
    return { success: false, error: error.message || 'Request failed' };
  }
};

// api.js - Add these functions

export const getMeetingDetails = async (meetingId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/meeting/${meetingId}`
    );
    return response.data.meeting;
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    throw error;
  }
};

export const getMemberDemands = async (meetingId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/meeting/${meetingId}/member-demands`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching member demands:', error);
    throw error;
  }
};



// ─── Export all as default ──────────────────────────────────────

export default {
  // Location
  fetchStates,
  fetchDistricts,
  fetchLocations,
  fetchClusters,
  fetchGroups,
  fetchMembers,
  
  // PPG
  fetchPPGList,
  fetchPPGListForOriginal,  // Alias for compatibility
  fetchPPGListSimple,
  fetchAllPPGs,
  fetchPPGNameTables,
  fetchAllPPGNameTables,
  createPPGSimple,
  createPPGOriginal,
  createPPGMembers,
  fetchPPGMembersFromTable,
  
  // PPG Name Table
  fetchPPGNameList,
  fetchPPGNameGroups,
  fetchPPGNameMembers,
  
  // FPO
  generateFPOCode,
  createFPO,
  createFPOMembers,
  
  // FPO Demand
  createFPODemand,
  fetchFPODemands,
  
  // Units
  fetchUnits,
  createUnit,
  
  // Products
  fetchProducts,
  fetchProductsByPPG,
  createProduct,
  deleteProduct,
    fetchAllPPGsForProducts,  // Add this
  fetchPPGProducts,         // Add this
  createPPGProduct,   
  // Meetings
// Meetings
savePPGMeeting,
fetchPPGMeetings,
fetchMeetingById,
getMeetingDetails,
getMemberDemands,

  
  // Test
  testDBConnection,
  testPPGMembers,
  testAllPPGMembers,
  
  // Utility
  handleApiError,
};