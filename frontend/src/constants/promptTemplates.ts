import { 
  CoffeeOutlined, 
  ShoppingOutlined, 
  HeartOutlined, 
  HomeOutlined 
} from '@ant-design/icons';

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  prompt: string;
  color: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'food',
    category: 'Food',
    title: 'Food & Restaurant',
    description: 'Create engaging social media content for your restaurant, cafe, or bakery',
    icon: CoffeeOutlined,
    color: '#ff6b6b',
    prompt: `I'm a [restaurant/cafe/bakery] owner and want to create social media marketing content. Please help me:
1. Create an attractive Instagram post copy for our new [dish name]
2. Include product features, taste descriptions, and recommendations
3. Use warm and appealing language style
4. Add appropriate hashtag suggestions
5. Provide the best posting time recommendations

Please generate complete social media content for me.`
  },
  {
    id: 'fashion',
    category: 'Fashion',
    title: 'Fashion & Apparel',
    description: 'Create product descriptions and styling suggestions for your clothing or accessory store',
    icon: ShoppingOutlined,
    color: '#4ecdc4',
    prompt: `I'm a [clothing store/accessory store/shoe store] owner and need to create product marketing content. Please help me:
1. Write detailed product descriptions for [product name/type]
2. Provide 3-5 different styling suggestions
3. Explain suitable occasions and seasons
4. Create attractive social media post copy
5. Include product highlights and purchase reasons

Please generate complete marketing content for me.`
  },
  {
    id: 'beauty',
    category: 'Beauty',
    title: 'Beauty & Salon',
    description: 'Create service showcases and case studies for your beauty salon, hair salon, or nail salon',
    icon: HeartOutlined,
    color: '#ff9ff3',
    prompt: `I'm a [hair salon/nail salon/beauty salon/cosmetics store] owner and need to create marketing content. Please help me:
1. Introduce our [service/product name]
2. Showcase service results and customer cases
3. Explain service features and advantages
4. Create attractive social media content to attract potential customers
5. Provide promotional campaign copy suggestions

Please generate professional marketing content for me.`
  },
  {
    id: 'home',
    category: 'Home',
    title: 'Home & Decor',
    description: 'Create product showcases and styling inspiration for your furniture or home decor store',
    icon: HomeOutlined,
    color: '#95e1d3',
    prompt: `I'm a [furniture store/decor store/home textile store/daily necessities store] owner and need to create product marketing content. Please help me:
1. Write detailed product introductions for [product name/type]
2. Provide home styling suggestions and design inspiration
3. Explain product practicality and decorative effects
4. Create attractive product showcase copy
5. Include usage scenarios and purchase reasons

Please generate complete marketing content for me.`
  }
];
