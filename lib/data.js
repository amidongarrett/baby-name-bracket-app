// Navigation Links
export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/projects' },
];

// Social Links
export const socialLinks = [
  { platform: 'GitHub', url: 'https://github.com/yourusername', icon: 'github' },
  { platform: 'LinkedIn', url: 'https://linkedin.com/in/yourusername', icon: 'linkedin' },
  { platform: 'Email', url: 'mailto:your.email@example.com', icon: 'email' },
];

// Hero Data
export const heroData = {
  name: 'Your Name',
  title: 'Full-Stack Developer',
  description: 'Building modern web applications with React, TypeScript, and Node.js',
  profileImage: '/images/profile.jpg',
};

// Quick Links
export const quickLinks = [
  { label: 'View Projects', href: '/projects', variant: 'primary' },
  { label: 'About Me', href: '/about', variant: 'secondary' },
  { label: 'Download CV', href: '/cv.pdf', variant: 'outline', external: true },
];

// Skills
export const skillCategories = [
  {
    category: 'Frontend',
    icon: '🎨',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'JavaScript'],
  },
  {
    category: 'Backend',
    icon: '⚙️',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs'],
  },
  {
    category: 'Tools',
    icon: '🛠️',
    skills: ['Git', 'Docker', 'VS Code', 'Figma', 'Postman'],
  },
  {
    category: 'Other',
    icon: '🚀',
    skills: ['Agile', 'CI/CD', 'Testing', 'Cloud Platforms'],
  },
];

// Timeline
export const timelineData = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    organization: 'Tech Company',
    period: '2023 - Present',
    description:
      'Leading frontend development initiatives and mentoring junior developers. Built multiple client-facing applications using Next.js and TypeScript.',
    type: 'work',
    location: 'Remote',
  },
  {
    id: '2',
    title: 'Full-Stack Developer',
    organization: 'Startup Inc',
    period: '2021 - 2023',
    description:
      'Developed and maintained web applications for various clients. Implemented RESTful APIs and responsive user interfaces.',
    type: 'work',
    location: 'San Francisco, CA',
  },
  {
    id: '3',
    title: 'Junior Developer',
    organization: 'Digital Agency',
    period: '2019 - 2021',
    description:
      'Built responsive websites and web applications. Collaborated with design and backend teams to deliver high-quality products.',
    type: 'work',
    location: 'New York, NY',
  },
  {
    id: '4',
    title: 'B.S. Computer Science',
    organization: 'University Name',
    period: '2015 - 2019',
    description:
      'Focused on software engineering, algorithms, and web technologies. Graduated with honors.',
    type: 'education',
    location: 'City, State',
  },
];

// Projects
export const projects = [
  {
    id: '1',
    title: 'E-Commerce Platform',
    description: 'Full-featured online store with payment integration and admin dashboard',
    image: '/images/projects/ecommerce.jpg',
    tags: ['Next.js', 'Stripe', 'PostgreSQL', 'Tailwind CSS'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/ecommerce',
    featured: true,
  },
  {
    id: '2',
    title: 'Task Management App',
    description: 'Collaborative task management tool with real-time updates',
    image: '/images/projects/taskmanager.jpg',
    tags: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/taskmanager',
    featured: true,
  },
  {
    id: '3',
    title: 'Portfolio Website',
    description: 'Modern portfolio website with blog functionality',
    image: '/images/projects/portfolio.jpg',
    tags: ['Next.js', 'TypeScript', 'Markdown', 'Tailwind CSS'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/portfolio',
    featured: false,
  },
  {
    id: '4',
    title: 'Weather Dashboard',
    description: 'Real-time weather data visualization with forecasts',
    image: '/images/projects/weather.jpg',
    tags: ['React', 'OpenWeather API', 'Chart.js', 'CSS'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/weather',
    featured: false,
  },
  {
    id: '5',
    title: 'Social Media Analytics',
    description: 'Dashboard for tracking social media metrics and engagement',
    image: '/images/projects/analytics.jpg',
    tags: ['Next.js', 'D3.js', 'Node.js', 'PostgreSQL'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/analytics',
    featured: false,
  },
  {
    id: '6',
    title: 'Recipe Finder',
    description: 'Search and save your favorite recipes with nutritional information',
    image: '/images/projects/recipe.jpg',
    tags: ['React', 'Spoonacular API', 'Firebase', 'Material-UI'],
    liveUrl: 'https://example.com',
    repoUrl: 'https://github.com/yourusername/recipe',
    featured: false,
  },
];
