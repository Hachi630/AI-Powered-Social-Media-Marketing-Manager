// Preset answer data structure
export interface PresetAnswer {
  id: string;
  title: string;
  answer: string;
  steps?: string[]; // Optional steps array for step format
  format: 'step' | 'general';
  links?: { text: string; url: string }[];
}

export interface PresetAnswerCategory {
  categoryId: string;
  categoryName: string;
  options: PresetAnswer[];
}

// Preset answers database
export const presetAnswers: PresetAnswerCategory[] = [
  {
    categoryId: 'guide',
    categoryName: 'New User Guide',
    options: [
      {
        id: 'platform-intro',
        title: 'Platform Introduction',
        answer: 'Melo is an intelligent social media management platform that helps you:',
        steps: [
          '1. Manage multiple social media accounts in one place',
          '2. Plan and schedule content across platforms',
          '3. Analyze data and optimize your marketing strategy',
          '4. Automate your social media workflow',
        ],
        format: 'step',
      },
      {
        id: 'quick-start',
        title: 'Quick Start',
        answer: 'Get started with Melo in just a few steps:',
        steps: [
          '1. Click the "Create Activity" button in the top right',
          '2. Select your social media platform (Instagram, Facebook, etc.)',
          '3. Fill in your content and upload media',
          '4. Choose your posting time',
          '5. Click "Publish" to complete',
        ],
        format: 'step',
      },
      {
        id: 'calendar-features',
        title: 'Calendar Features',
        answer: 'The calendar helps you manage your content schedule:',
        steps: [
          '1. View all your scheduled posts in calendar view',
          '2. Drag and drop to reschedule posts',
          '3. Click on any event to edit details',
          '4. Use filters to view specific platforms',
          '5. Generate content plans automatically',
        ],
        format: 'step',
      },
      {
        id: 'social-connection',
        title: 'Social Media Connection',
        answer: 'Connect your social media accounts:',
        steps: [
          '1. Go to Settings or Social Dashboard',
          '2. Click "Connect" next to the platform you want',
          '3. Authorize Melo to access your account',
          '4. Your account will appear in the connected list',
          '5. Start creating and scheduling content',
        ],
        format: 'step',
      },
      {
        id: 'usage-tips',
        title: 'Usage Tips',
        answer: 'Here are some tips to get the most out of Melo:',
        steps: [
          '1. Use content planning to schedule posts in advance',
          '2. Take advantage of AI-generated content suggestions',
          '3. Analyze your best posting times using data insights',
          '4. Organize content into projects for better management',
          '5. Use templates to speed up content creation',
        ],
        format: 'step',
      },
      {
        id: 'common-questions',
        title: 'Common Questions',
        answer: 'Frequently asked questions:',
        steps: [
          '1. Q: How many accounts can I connect? A: You can connect unlimited accounts',
          '2. Q: Can I schedule posts? A: Yes, you can schedule posts for future dates',
          '3. Q: Is my data secure? A: Yes, we use industry-standard encryption',
          '4. Q: Can I edit posts after scheduling? A: Yes, click on any scheduled post to edit',
          '5. Q: Which platforms are supported? A: Instagram, Facebook, Twitter, LinkedIn',
        ],
        format: 'step',
      },
    ],
  },
  {
    categoryId: 'quick-create',
    categoryName: 'Quick Create',
    options: [
      {
        id: 'create-activity',
        title: 'How to Create Activity',
        answer: 'Create a new activity:',
        steps: [
          '1. Click "Create Activity" button or go to Calendar page',
          '2. Select social media platform (Instagram, Facebook, etc.)',
          '3. Choose content type (Post, Story, Reels)',
          '4. Fill in content or upload media files',
          '5. Set the posting date and time',
          '6. Click "Save" or "Publish Now"',
        ],
        format: 'step',
      },
      {
        id: 'create-project',
        title: 'How to Create Project',
        answer: 'Create a new project:',
        steps: [
          '1. Go to Dashboard or Calendar page',
          '2. Click "New Project" or use the project folder',
          '3. Enter project name and description',
          '4. Add activities to the project',
          '5. Organize and manage all related content',
        ],
        format: 'step',
      },
      {
        id: 'connect-instagram',
        title: 'How to Connect Instagram',
        answer: 'Connect your Instagram account:',
        steps: [
          '1. Go to Settings or Social Dashboard',
          '2. Find Instagram in the platform list',
          '3. Click "Connect" button',
          '4. Log in to your Instagram account',
          '5. Authorize Melo to access your account',
          '6. Your account will be connected and ready to use',
        ],
        format: 'step',
      },
      {
        id: 'plan-content',
        title: 'How to Plan Content',
        answer: 'Plan your content:',
        steps: [
          '1. Go to Calendar page',
          '2. Click "Generate Content Plan" or use AI assistant',
          '3. Describe your marketing goals',
          '4. Select platforms and date range',
          '5. Review and customize the generated plan',
          '6. Save to calendar',
        ],
        format: 'step',
      },
      {
        id: 'view-analytics',
        title: 'How to View Analytics',
        answer: 'View your analytics:',
        steps: [
          '1. Go to Dashboard or Social Dashboard',
          '2. Navigate to Analytics section',
          '3. Select date range and platform',
          '4. View engagement metrics and insights',
          '5. Export data if needed',
        ],
        format: 'step',
      },
      {
        id: 'setup-brand',
        title: 'How to Setup Brand',
        answer: 'Set up your brand profile:',
        steps: [
          '1. Go to Settings or Brand Profile page',
          '2. Fill in your brand name and industry',
          '3. Set your tone of voice and target audience',
          '4. Add your brand knowledge and products',
          '5. Save your settings',
        ],
        format: 'step',
      },
    ],
  },
  {
    categoryId: 'faq',
    categoryName: 'FAQ',
    options: [
      {
        id: 'faq-accounts',
        title: 'Account Management',
        answer: 'Account-related questions: You can manage your account in Settings. You can update your profile, change password, and manage connected social media accounts. All your data is securely stored and encrypted.',
        format: 'general',
      },
      {
        id: 'faq-platforms',
        title: 'Supported Platforms',
        answer: 'Melo currently supports Instagram (Post, Story, Reels), Facebook, Twitter, and LinkedIn. You can connect multiple accounts from each platform and manage them all in one place.',
        format: 'general',
      },
      {
        id: 'faq-scheduling',
        title: 'Post Scheduling',
        answer: 'Yes, you can schedule posts for future dates. Simply create an activity and set a future date and time. The post will be automatically published at the scheduled time.',
        format: 'general',
      },
      {
        id: 'faq-editing',
        title: 'Edit Scheduled Posts',
        answer: 'You can edit scheduled posts anytime before they are published. Go to Calendar, click on the scheduled post, and make your changes. After publishing, you can still edit on the platform itself.',
        format: 'general',
      },
      {
        id: 'faq-security',
        title: 'Data Security',
        answer: 'Your data security is our priority. We use industry-standard encryption, secure authentication, and comply with data protection regulations. Your social media credentials are stored securely and never shared.',
        format: 'general',
      },
      {
        id: 'faq-pricing',
        title: 'Pricing Information',
        answer: 'For pricing information, please check our website or contact support. We offer different plans to suit various needs, from individual creators to large teams.',
        format: 'general',
      },
    ],
  },
  {
    categoryId: 'tips',
    categoryName: 'Tips',
    options: [
      {
        id: 'tip-content-planning',
        title: 'Content Planning Tips',
        answer: 'Content planning best practices: Plan your content at least a week in advance. Use themes for consistency. Analyze your audience engagement to find best posting times. Use AI suggestions for content ideas. Keep a content calendar visible to your team.',
        format: 'general',
      },
      {
        id: 'tip-engagement',
        title: 'Increase Engagement',
        answer: 'To increase engagement: Post consistently at optimal times. Use relevant hashtags. Engage with your audience by responding to comments. Share behind-the-scenes content. Use stories and reels for more visibility.',
        format: 'general',
      },
      {
        id: 'tip-automation',
        title: 'Automation Tips',
        answer: 'Automation strategies: Schedule posts during your audience\'s active hours. Use content templates for faster creation. Set up recurring posts for regular content. Use AI to generate content ideas. Automate reporting and analytics.',
        format: 'general',
      },
      {
        id: 'tip-analytics',
        title: 'Analytics Tips',
        answer: 'Analytics best practices: Review your analytics weekly. Track which content types perform best. Monitor engagement rates and adjust strategy. Compare performance across platforms. Use insights to optimize posting times.',
        format: 'general',
      },
      {
        id: 'tip-collaboration',
        title: 'Team Collaboration',
        answer: 'Collaboration features: Use projects to organize team content. Assign tasks to team members. Use comments and notes for feedback. Set up approval workflows. Share calendars with your team.',
        format: 'general',
      },
    ],
  },
  {
    categoryId: 'project-guide',
    categoryName: 'Project Guide',
    options: [
      {
        id: 'project-create',
        title: 'Create Project',
        answer: 'Create and manage projects:',
        steps: [
          '1. Go to Dashboard or Calendar',
          '2. Click "New Project" or use project folders',
          '3. Enter project name and description',
          '4. Add activities and content to the project',
          '5. Organize and track project progress',
        ],
        format: 'step',
      },
      {
        id: 'project-organize',
        title: 'Organize Projects',
        answer: 'Organize your projects:',
        steps: [
          '1. Create project folders for different campaigns',
          '2. Group related activities together',
          '3. Use tags and labels for easy filtering',
          '4. Set project deadlines and milestones',
          '5. Track project performance',
        ],
        format: 'step',
      },
      {
        id: 'project-templates',
        title: 'Use Templates',
        answer: 'Use project templates:',
        steps: [
          '1. Create a project with your preferred structure',
          '2. Save it as a template',
          '3. Use the template for similar projects',
          '4. Customize as needed for each project',
          '5. Save time on repetitive setup',
        ],
        format: 'step',
      },
    ],
  },
];

// Helper function to get preset answer by category and option ID
export function getPresetAnswer(categoryId: string, optionId: string): PresetAnswer | null {
  const category = presetAnswers.find(cat => cat.categoryId === categoryId);
  if (!category) return null;
  
  const answer = category.options.find(opt => opt.id === optionId);
  return answer || null;
}

// Helper function to get all options for a category
export function getCategoryOptions(categoryId: string): PresetAnswer[] {
  const category = presetAnswers.find(cat => cat.categoryId === categoryId);
  return category ? category.options : [];
}
