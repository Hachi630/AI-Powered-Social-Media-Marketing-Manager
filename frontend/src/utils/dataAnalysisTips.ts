// Data analysis tips for ELO assistant

export interface DataAnalysisTip {
  id: string;
  message: string;
  category: 'timing' | 'content' | 'platform' | 'engagement' | 'strategy';
}

// Collection of data analysis tips
export const dataAnalysisTips: DataAnalysisTip[] = [
  // Timing tips
  {
    id: 'tip-timing-1',
    message: 'Best posting time tip: Posting between 2-3 PM on weekdays typically gets 20% more engagement',
    category: 'timing',
  },
  {
    id: 'tip-timing-2',
    message: 'Weekend posting tip: Saturday mornings (9-11 AM) show higher engagement rates for lifestyle content',
    category: 'timing',
  },
  {
    id: 'tip-timing-3',
    message: 'Peak engagement hours: Tuesday-Thursday, 1-3 PM are optimal for B2B content',
    category: 'timing',
  },
  {
    id: 'tip-timing-4',
    message: 'Evening posts (7-9 PM) perform best for entertainment and lifestyle brands',
    category: 'timing',
  },
  
  // Content tips
  {
    id: 'tip-content-1',
    message: 'Content tip: Posts with images get 2.3x more engagement than text-only posts',
    category: 'content',
  },
  {
    id: 'tip-content-2',
    message: 'Video content generates 3x more engagement than static images on most platforms',
    category: 'content',
  },
  {
    id: 'tip-content-3',
    message: 'Posts with questions in the caption increase comments by 40%',
    category: 'content',
  },
  {
    id: 'tip-content-4',
    message: 'Using 3-5 hashtags is optimal - too many can reduce engagement',
    category: 'content',
  },
  
  // Platform tips
  {
    id: 'tip-platform-1',
    message: 'Instagram tip: Stories posted between 6-9 PM get the most views',
    category: 'platform',
  },
  {
    id: 'tip-platform-2',
    message: 'LinkedIn tip: Tuesday-Thursday, 8-10 AM are best for professional content',
    category: 'platform',
  },
  {
    id: 'tip-platform-3',
    message: 'Facebook tip: Thursday and Friday afternoons show peak engagement',
    category: 'platform',
  },
  {
    id: 'tip-platform-4',
    message: 'Twitter tip: Weekday mornings (8-10 AM) are optimal for news and updates',
    category: 'platform',
  },
  
  // Engagement tips
  {
    id: 'tip-engagement-1',
    message: 'Engagement tip: Responding to comments within the first hour increases overall engagement',
    category: 'engagement',
  },
  {
    id: 'tip-engagement-2',
    message: 'Posts with user-generated content receive 28% higher engagement rates',
    category: 'engagement',
  },
  {
    id: 'tip-engagement-3',
    message: 'Consistent posting (3-5 times per week) builds better audience engagement',
    category: 'engagement',
  },
  
  // Strategy tips
  {
    id: 'tip-strategy-1',
    message: 'Strategy tip: Mixing educational (40%), entertaining (30%), and promotional (30%) content works best',
    category: 'strategy',
  },
  {
    id: 'tip-strategy-2',
    message: 'A/B testing different post formats can improve engagement by up to 35%',
    category: 'strategy',
  },
  {
    id: 'tip-strategy-3',
    message: 'Posts with behind-the-scenes content generate 2x more engagement than product-only posts',
    category: 'strategy',
  },
];

/**
 * Get a random tip
 */
export function getRandomTip(): DataAnalysisTip {
  const randomIndex = Math.floor(Math.random() * dataAnalysisTips.length);
  return dataAnalysisTips[randomIndex];
}

/**
 * Get a tip by category
 */
export function getTipByCategory(category: DataAnalysisTip['category']): DataAnalysisTip {
  const categoryTips = dataAnalysisTips.filter(tip => tip.category === category);
  if (categoryTips.length === 0) {
    return getRandomTip();
  }
  const randomIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomIndex];
}

/**
 * Get next tip in sequence (for rotation)
 */
let currentTipIndex = 0;
export function getNextTip(): DataAnalysisTip {
  const tip = dataAnalysisTips[currentTipIndex];
  currentTipIndex = (currentTipIndex + 1) % dataAnalysisTips.length;
  return tip;
}
