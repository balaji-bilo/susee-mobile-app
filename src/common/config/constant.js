// export const base_url = 'https://dvsos-backend.onrender.com/api';
export const base_url = 'http://192.168.1.23:5000/api';

// Auth Endpoints
export const login = '/auth/login';
export const profile = '/auth/me';
export const submit_profile = '/auth/profile';
export const forgot_password = '/auth/forgot-password';
export const SECRET_KEY = 'susee_secure_secret_key_999!';

// Gate Security Endpoints
export const check_vehicle = '/mobile/gate-entry/check-vehicle';
export const submit_entry = '/mobile/gate-entry';
export const exit = '/mobile/gate-entry/exit';
export const get_history = '/mobile/gate-entry/history';

// Job Card Endpoints
export const job_card = '/mobile/job-cards/queue';
export const mobile_floor_job_cards = '/mobile/job-cards/floor-supervisor-list';
export const service_items_list = '/crm/service-items/list';
export const brands_list = '/crm/brands/list';
export const form_entry = '/mobile/job-cards/create-from-gate-entry';
export const record_list = '/mobile/job-cards/list';
export const record_details = '/mobile/job-cards/detail';
export const lookup_vehicle = '/mobile/job-cards/lookup-vehicle';
export const mobile_additional_work_list = '/mobile/additional-work/list';
export const mobile_assign_mechanic_list = '/mobile/assign-mechanic/list';
export const mobile_assign_mechanic_assign = '/mobile/assign-mechanic/assign';
export const mobile_assign_mechanic_skip = '/mobile/assign-mechanic/skip';
// Notification & FCM Endpoints
export const save_fcm_token = '/device-token';
export const notification_count = '/notifications/unread-count';
export const notification_list = '/notifications';
export const notification_marked = '/notifications/read';
export const delete_fcm_token = '/device-token';
