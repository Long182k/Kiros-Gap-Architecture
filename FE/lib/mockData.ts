import { GapAnalysis } from '@/types/analysis';

export const mockAnalysisHistory: GapAnalysis[] = [
  {
    id: '1',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    resumeText: 'Software Engineer with 3 years of experience in React, JavaScript, and Node.js. Built multiple web applications...',
    jobDescription: 'Senior Full Stack Developer needed. Must have experience with React, TypeScript, Docker, Kubernetes, and AWS...',
    targetRole: 'Senior Full Stack Developer',
    matchScore: 68,
    missingSkills: [
      { name: 'Docker', category: 'tool', priority: 'high' },
      { name: 'Kubernetes', category: 'tool', priority: 'high' },
      { name: 'AWS', category: 'framework', priority: 'medium' },
      { name: 'TypeScript', category: 'technical', priority: 'medium' },
    ],
    learningSteps: [
      {
        id: 1,
        title: 'Master Docker Fundamentals',
        description: 'Build and containerize a full-stack CRUD application using Docker. Learn Dockerfile creation, multi-stage builds, and docker-compose for local development.',
        estimatedTime: '2 weeks',
        resources: ['Docker Official Docs', 'Docker for Developers Course'],
      },
      {
        id: 2,
        title: 'Deploy to Kubernetes',
        description: 'Take your Dockerized application and deploy it to a Kubernetes cluster. Learn about pods, deployments, services, and ingress controllers.',
        estimatedTime: '3 weeks',
        resources: ['Kubernetes.io', 'KodeKloud K8s Course'],
      },
      {
        id: 3,
        title: 'AWS Cloud Infrastructure',
        description: 'Set up your application on AWS using ECS or EKS. Learn about VPCs, load balancers, and CI/CD pipelines with CodePipeline.',
        estimatedTime: '4 weeks',
        resources: ['AWS Free Tier', 'A Cloud Guru'],
      },
    ],
    interviewQuestions: [
      {
        id: 1,
        question: 'How would you design a CI/CD pipeline for a microservices architecture using Docker and Kubernetes?',
        skillTargeted: 'Docker, Kubernetes',
        difficulty: 'hard',
      },
      {
        id: 2,
        question: 'Explain the difference between Docker Swarm and Kubernetes. When would you choose one over the other?',
        skillTargeted: 'Kubernetes',
        difficulty: 'medium',
      },
      {
        id: 3,
        question: 'What AWS services would you use to ensure high availability for a web application?',
        skillTargeted: 'AWS',
        difficulty: 'medium',
      },
    ],
    isCached: false,
  },
  {
    id: '2',
    createdAt: new Date('2024-01-10T14:20:00'),
    updatedAt: new Date('2024-01-10T14:20:00'),
    resumeText: 'Frontend Developer specializing in Vue.js and Angular. Experience with REST APIs and responsive design...',
    jobDescription: 'React Developer with Redux experience needed for fintech startup...',
    targetRole: 'React Developer',
    matchScore: 45,
    missingSkills: [
      { name: 'React', category: 'framework', priority: 'high' },
      { name: 'Redux', category: 'framework', priority: 'high' },
      { name: 'Fintech Domain', category: 'soft', priority: 'low' },
    ],
    learningSteps: [
      {
        id: 1,
        title: 'Learn React Fundamentals',
        description: 'Complete the official React tutorial and build 3 small projects using hooks and functional components.',
        estimatedTime: '3 weeks',
      },
      {
        id: 2,
        title: 'Master Redux Toolkit',
        description: 'Implement state management in your React projects using Redux Toolkit, RTK Query, and async thunks.',
        estimatedTime: '2 weeks',
      },
      {
        id: 3,
        title: 'Build a Fintech Project',
        description: 'Create a personal finance dashboard with charts, transactions, and real-time data updates.',
        estimatedTime: '4 weeks',
      },
    ],
    interviewQuestions: [
      {
        id: 1,
        question: 'Explain the virtual DOM in React and how it improves performance.',
        skillTargeted: 'React',
        difficulty: 'easy',
      },
      {
        id: 2,
        question: 'How does Redux Toolkit simplify Redux development compared to vanilla Redux?',
        skillTargeted: 'Redux',
        difficulty: 'medium',
      },
      {
        id: 3,
        question: 'How would you handle real-time stock price updates in a React application?',
        skillTargeted: 'React, Fintech',
        difficulty: 'hard',
      },
    ],
    isCached: true,
  },
];

export const generateMockAnalysis = (resumeText: string, jobDescription: string): GapAnalysis => {
  return {
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    resumeText,
    jobDescription,
    targetRole: 'Software Engineer',
    matchScore: Math.floor(Math.random() * 40) + 50,
    missingSkills: [
      { name: 'GraphQL', category: 'technical', priority: 'high' },
      { name: 'PostgreSQL', category: 'technical', priority: 'medium' },
      { name: 'System Design', category: 'soft', priority: 'high' },
    ],
    learningSteps: [
      {
        id: 1,
        title: 'Learn GraphQL with Apollo',
        description: 'Build a full-stack application using Apollo Client and Apollo Server. Understand queries, mutations, and subscriptions.',
        estimatedTime: '2 weeks',
      },
      {
        id: 2,
        title: 'Master PostgreSQL',
        description: 'Design efficient database schemas, write complex queries, and implement proper indexing strategies.',
        estimatedTime: '3 weeks',
      },
      {
        id: 3,
        title: 'Study System Design',
        description: 'Learn how to design scalable distributed systems. Practice with common interview problems like designing Twitter or Netflix.',
        estimatedTime: '4 weeks',
      },
    ],
    interviewQuestions: [
      {
        id: 1,
        question: 'How does GraphQL differ from REST, and when would you choose one over the other?',
        skillTargeted: 'GraphQL',
        difficulty: 'medium',
      },
      {
        id: 2,
        question: 'Explain database normalization and when you might choose to denormalize.',
        skillTargeted: 'PostgreSQL',
        difficulty: 'medium',
      },
      {
        id: 3,
        question: 'Design a URL shortening service like bit.ly. How would you handle scale?',
        skillTargeted: 'System Design',
        difficulty: 'hard',
      },
    ],
    isCached: false,
  };
};
