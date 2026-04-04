export const profileData = {
  rank: 1482,
  topPercent: "0.8%",
  activeDevelopers: "1.2M",
  rating: 2140,
  
  username: "Alex \"The Architect\" Chen",
  title: "Full-stack Developer",
  location: "Seattle, WA",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  level: 42,
  
  solved: {
    easy: { current: 312, total: 450 },
    medium: { current: 245, total: 800 },
    hard: { current: 85, total: 350 },
    total: 642
  },

  streak: {
    current: 18,
    max: 42,
    activeDays: 256
  },
  
  contributionsCount: 1124,
  recentSubmissions: [
    { id: 1, title: "LRU Cache Implementation", difficulty: "Hard", time: "82 ms", memory: "48.2 MB", status: "Solved" },
    { id: 2, title: "Two Sum IV - Input is a BST", difficulty: "Easy", time: "14 ms", memory: "12.1 MB", status: "Solved" },
    { id: 3, title: "Valid Sudoku Solver", difficulty: "Medium", time: "34 ms", memory: "16.4 MB", status: "Attempted" },
    { id: 4, title: "Course Schedule II", difficulty: "Medium", time: "56 ms", memory: "22.8 MB", status: "Solved" }
  ]
};

// Generates a mock 52-week activity heatmap data array matching GitHub style
export const generateHeatmapData = () => {
  const weeks = 52;
  const daysInWeek = 7;
  const heatmap = [];

  for (let i = 0; i < weeks; i++) {
    const week = [];
    for (let j = 0; j < daysInWeek; j++) {
      // Create random activity level (0-4) mirroring Github contribution colors
      // We weight 0 heavily so it isn't completely filled.
      const rnd = Math.random();
      let level = 0;
      if (rnd > 0.6) level = 1;
      if (rnd > 0.8) level = 2;
      if (rnd > 0.9) level = 3;
      if (rnd > 0.95) level = 4;
      week.push(level);
    }
    heatmap.push(week);
  }
  return heatmap;
};
