/**
 * Account model representing Shiftboard user accounts
 * Structure aligned with the Shiftboard API response format
 */
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  // Required fields from sample data
  id: {
    type: String,
    required: true,
    unique: true
  },
  external_id: String,
  first_name: String,
  last_name: String,
  mobile_phone: String, // Important field needed by client
  profile_type: String,
  screen_name: String,
  seniority_order: String,
  phone: String,
  email: String,
  clocked_in: Boolean,
  active: Boolean,
  org_unit: String,
  username: String,
  created_at: Date,
  updated_at: Date,
  last_login: Date,
  
  // Metadata fields for our system
  raw_data: Object, // Store any additional data not mapped explicitly
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for common lookup fields
AccountSchema.index({ external_id: 1 });
AccountSchema.index({ screen_name: 1 });

module.exports = mongoose.model('Account', AccountSchema);
