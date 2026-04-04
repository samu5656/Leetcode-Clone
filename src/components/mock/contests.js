export const upcomingContests = [
  {
    id: 400,
    title: "Weekly Contest 400",
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 3 days 4 hours from now
    duration: "1 hr 30 mins",
    type: "Weekly",
    sponsor: "Leetclone",
    registered: 15420,
  },
  {
    id: 130,
    title: "Biweekly Contest 130",
    startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 10 days 2 hours from now
    duration: "1 hr 30 mins",
    type: "Biweekly",
    sponsor: "Leetclone",
    registered: 8900,
  }
];

export const pastContests = [
  {
    id: 399,
    title: "Weekly Contest 399",
    date: "2026-03-31",
    participants: 28410,
    status: "Ended"
  },
  {
    id: 129,
    title: "Biweekly Contest 129",
    date: "2026-03-24",
    participants: 21050,
    status: "Ended"
  },
  {
    id: 398,
    title: "Weekly Contest 398",
    date: "2026-03-24",
    participants: 30120,
    status: "Ended"
  },
  {
    id: 397,
    title: "Weekly Contest 397",
    date: "2026-03-17",
    participants: 29500,
    status: "Ended"
  }
];
