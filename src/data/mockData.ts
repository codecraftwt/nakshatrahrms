export const mockUser = {
  name: 'Raj Kumar',
  initials: 'RK',
  employeeId: 'EMP-10042',
  designation: 'Senior Field Executive',
  department: 'Sales',
  baseOffice: 'Mumbai HQ',
  shift: { name: 'Morning shift', time: '9:00 AM – 6:00 PM' },
};

export const mockDashboard = {
  kmToday: 0.0,
  kmMonth: 142,
  presentDays: 18,
  leaveBalance: 8,
  punchStatus: 'not_punched',  // 'punched_in' | 'punched_out' | 'not_punched'
  todayDate: 'Wed, 4 Jun',
};

export const mockAttendance = [
  { date: 'Wed 4 Jun', time: 'Not punched yet', status: 'pending' },
  { date: 'Tue 2 Jun', time: '9:02 AM – 6:11 PM', status: 'present', km: 12.4 },
  { date: 'Mon 1 Jun', time: '9:14 AM – 6:05 PM', status: 'present', km: 9.8 },
  { date: 'Fri 30 May', time: '—', status: 'absent', km: 0 },
];

export const mockLeaveBalance = {
  earned: 6,
  sick: 3,
  casual: { total: 5, remaining: 2 },
};

export const mockLeaveRequests = [
  { id: '1', type: 'Sick leave', date: '28 May', days: 1, reason: 'Fever', status: 'approved', approver: 'Rahul Sharma' },
  { id: '2', type: 'Earned leave', date: '15 Apr', days: 2, reason: 'Personal', status: 'approved', approver: 'Rahul Sharma' },
  { id: '3', type: 'Casual leave', date: '3 Jun', days: 1, reason: 'Family function', status: 'pending', approver: 'Rahul Sharma' },
];
